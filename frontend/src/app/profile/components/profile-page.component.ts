import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { FollowApiService } from '../../core/services/follow-api.service';
import { ContextStoreService } from '../../core/store/context-store.service';
import { EmployeeStoreService } from '../../core/store/employee-store.service';
import { AuthSetting } from '../../shared/models/auth-setting.model';
import { DictionaryModel } from '../../shared/models/dictionary.model';
import { Employee } from '../../shared/models/employee.model';
import { FollowModel, UserFollow } from '../../shared/models/follow.model';

@Component({
  selector: 'app-team',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public selectedUser: Employee;
  public isAdmin$: Observable<boolean>;
  public isEdit = false;
  public canEdit = false;
  private login: string;
  private getCurrentUserSub = new Subscription();
  public projects: DictionaryModel[];
  public selectedTabIndex = this.route.snapshot.queryParams.tab || 0;

  public users$: Observable<Employee[]>;
  public settings$: Observable<AuthSetting>;

  public userFollow: UserFollow;

  constructor(
    private contextStoreService: ContextStoreService,
    private employeeApiService: EmployeeApiService,
    private employeeStoreService: EmployeeStoreService,
    private route: ActivatedRoute,
    private router:Router,
    private followApi: FollowApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.users$ = this.employeeApiService.loadAllEmployees();

    this.getUserInfo();
    this.isAdmin$ = this.contextStoreService.isCurrentUserAdmin$();
    this.settings$ = this.contextStoreService.settings$.pipe(filter(s => !!s));
  }

  ngOnDestroy() {
    this.getCurrentUserSub.unsubscribe();
  }

  public onUpdateProfile(employee: Employee): void {
    this.employeeApiService.updateUserInfo(this.login, employee).subscribe(() => {
      this.contextStoreService.update();
      this.employeeStoreService.update();
      this.loadFollow(this.selectedUser._id);
    });
  }

  public addFollow(data: FollowModel): void {
    this.followApi.addFollow(data).subscribe(res => this.loadFollow(this.selectedUser._id));
  }

  public deleteFollowing(id: string) {
    this.followApi.deleteFollow(id).subscribe(res => this.loadFollow(this.selectedUser._id));
  }

  public getAvatarSrc() {
    return `${environment.baseUrl}/avatar?login=` + this.login;
  }

  public tabChange(id: number) {
    this.router.navigate([], {
      queryParams: { ...this.route.snapshot.queryParams, tab: id }
    });
  }

  private getUserInfo(): void {
    this.login = this.route.snapshot.params.id;
    if (!this.login) {
      this.getUserFromStore();
      this.canEdit = true;
    } else {
      this.getUserFromApi();
    }
  }

  private getUserFromApi() {
    this.getCurrentUserSub.add(
      this.employeeApiService.searchUserByLogin(this.login).subscribe((user: Employee) => {
        this.setSelectedUser(user);
        this.loadFollow(user._id);
      })
    );
  }

  private getUserFromStore() {
    this.getCurrentUserSub.add(
      this.contextStoreService
        .getCurrentUser$()
        .pipe(filter(user => !!user))
        .subscribe(user => {
          this.setSelectedUser(user);
          this.login = user.mailNickname;
          this.loadFollow(user._id);
        })
    );
  }

  public loadFollow(userId: string) {
    this.getCurrentUserSub.add(this.followApi.getUserFollow(userId).subscribe(res => (this.userFollow = res)));
  }

  private setSelectedUser(user: Employee): void {
    this.selectedUser = user;
  }
}
