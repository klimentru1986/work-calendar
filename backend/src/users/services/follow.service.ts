import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowEntity, FollowType } from '../../entity/entities/follow.entity.model';
import { FollowerModel } from '../models/follow.model';
import * as moment from 'moment';
import { UserEntity } from '../../entity/entities/user.entity.model';
import { UsersService } from './users.service';
import { ProjectNewMetadataEntity } from '../../entity/entities/project-new-metadata.entity';
import { ProjectNewEntity } from '../../entity/entities/project-new.entity';

export interface UserFollow {
  following: UserEntity[];
  followers: UserEntity[];
  allForUser: FollowEntity[];
}

@Injectable()
export class FollowService {
  constructor(
    @InjectModel('Follow') private readonly followModel: Model<FollowEntity>,
    private userService: UsersService
  ) {}

  async getUserFollow(userId: string): Promise<UserFollow> {
    const following = await this.getUserFollowing(userId);
    const followers = await this.getUserFollowers(userId);
    const allForUser = await this.getAllStaticFollowsForUser(userId);

    return {
      following,
      followers,
      allForUser
    };
  }

  /** Получение всех ручных подписок пользователя */
  async getAllStaticFollowsForUser(userId: string): Promise<FollowEntity[]> {
    return await this.followModel
      .find({ $or: [{ followerId: userId }, { followingId: userId }] })
      .populate('followingId')
      .populate('followerId')
      .exec();
  }

  /** Получение людей на которых подписан пользователь */
  async getUserFollowing(userId: string): Promise<UserEntity[]> {
    const allUsers = await this.userService.getUsers();
    const user = await this.userService.getUserById(userId);

    let followingByProjects = this.matchUsersAndActiveProjects(user, allUsers);

    /** Если у пользователя нет проектов, то он подписан на всех */
    if (!this.haveProjectsInCurrentMonth(user.projectsNew)) {
      followingByProjects = allUsers;
    }

    const addedFollowing = await this.followModel.find({ followerId: user.id, followType: FollowType.add });

    const removedFollowing = await this.followModel.find({ followerId: user.id, followType: FollowType.remove });

    const addedUsers = addedFollowing.map(item => item.followingId).map(u => u.toString());
    const removedUsers = removedFollowing.map(item => item.followingId).map(u => u.toString());

    return this.addUserToArr(addedUsers, followingByProjects, allUsers)
      .filter(u => this.removeMyselfFromArr(u.id, user.id))
      .filter(u => this.removeUsersFromArr(removedUsers, u.id));
  }

  async addFollow(data: FollowerModel): Promise<FollowEntity> {
    const newFollow = await this.followModel.create(data);
    return newFollow.save();
  }

  async deleteFollow(id: string): Promise<FollowEntity> {
    return this.followModel.findByIdAndDelete(id);
  }

  /** Получение людей подписанных на пользователя */
  async getUserFollowers(userId: string): Promise<UserEntity[]> {
    const allUsers = await this.userService.getUsers();
    const user = await this.userService.getUserById(userId);

    const followersByProjects = this.matchUsersAndActiveProjects(user, allUsers);
    const followersByEmptyProject = allUsers.filter(user => !this.haveProjectsInCurrentMonth(user.projectsNew));

    const addedFollowersArr = await this.followModel.find({ followingId: user.id, followType: FollowType.add });

    const removedFollowersArr = await this.followModel.find({
      followingId: user.id,
      followType: FollowType.remove
    });

    const addedUsers = addedFollowersArr.map(item => item.followerId).map(u => u.toString());
    const removedUsers = removedFollowersArr.map(item => item.followerId).map(u => u.toString());

    return this.addUserToArr(addedUsers, [...followersByProjects, ...followersByEmptyProject], allUsers)
      .filter(u => this.removeMyselfFromArr(u.id, user.id))
      .filter(u => this.removeUsersFromArr(removedUsers, u.id));
  }

  // Добавление пользователя в массив
  // проверяем, если он уже там есть, вернем массив
  // если его там нет, добавим
  private addUserToArr(addedUsers: string[], mainArr: UserEntity[], allUsers: UserEntity[]): UserEntity[] {
    if (!addedUsers.length) {
      return mainArr;
    }

    const usersAbsentInMainArr = addedUsers.filter(element => !mainArr.some(elem => element === elem.id));

    if (!usersAbsentInMainArr.length) {
      return mainArr;
    }

    const userArr = usersAbsentInMainArr.map(item => {
      return allUsers.find(el => el.id === item);
    });

    return [...mainArr, ...userArr];
  }

  private removeUsersFromArr(removedUsers: string[], userId: string): boolean {
    return !removedUsers.includes(userId.toString());
  }

  private removeMyselfFromArr(userId: string, myId: string) {
    return userId.toString() !== myId.toString();
  }

  private matchUsersAndActiveProjects(selectedUser: UserEntity, allUsers: UserEntity[]): UserEntity[] {
    const selectedUserActiveProjects = this.getActiveUserProjects(selectedUser);

    return allUsers.filter(user => {
      const userActiveProjects = this.getActiveUserProjects(user);

      return userActiveProjects.some(pr => selectedUserActiveProjects.includes(pr));
    });
  }

  private getActiveUserProjects(user: UserEntity): string[] {
    const currentDate = moment();
    return user.projectsNew
      .filter(p => p.metadata.some(m => currentDate.isSame(this.mapMetadataToDate(m), 'month')))
      .filter(p => p.project_id)
      .map(p => p.project_id.toString());
  }

  private haveProjectsInCurrentMonth(projects: ProjectNewEntity[]): boolean {
    const currentDate = moment();
    return projects.some(p => p.metadata.some(m => currentDate.isSame(this.mapMetadataToDate(m), 'month')));
  }

  private mapMetadataToDate(m: ProjectNewMetadataEntity): moment.Moment {
    return moment(`${m.month}-${m.year}`, 'M-YYYY');
  }
}
