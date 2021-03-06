import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DictionaryApiService } from '../../../core/services/dictionary-api.service';
import { DictionaryModel } from '../../../shared/models/dictionary.model';
import { Employee } from '../../../shared/models/employee.model';

@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss']
})
export class ProfileFormComponent implements OnInit {
  @Input()
  selectedUser: Employee;

  @Input()
  isAdmin: boolean;

  @Input()
  canEdit: boolean;

  @Output()
  updateProfile = new EventEmitter<Employee>();

  public profileForm: FormGroup;
  public jobPositions: DictionaryModel[];
  public subdivisions: DictionaryModel[];
  public isEdit = false;

  constructor(private fb: FormBuilder, private dictionaryApi: DictionaryApiService) {}

  ngOnInit() {
    this.initForm(this.selectedUser);
    this.getUserInfo();
  }

  public editStart(): void {
    this.profileForm.get('location').enable();
    this.profileForm.get('telNumber').enable();
    this.profileForm.get('hasMailing').enable();

    if (this.isAdmin) {
      this.profileForm.get('subdivision').enable();
      this.profileForm.get('jobPosition').enable();
      this.profileForm.get('isAdmin').enable();
    }
    this.isEdit = true;
  }

  public cancelEdit(): void {
    this.profileForm.disable();
    this.isEdit = false;
  }

  public onUpdateProfile() {
    this.updateProfile.emit(this.profileForm.getRawValue());
    this.cancelEdit();
  }

  private initForm(user: Employee): void {
    this.profileForm = this.fb.group({
      id: new FormControl(user._id),
      username: new FormControl(user.username),
      email: new FormControl(user.email),
      location: new FormControl(user.location),
      telNumber: new FormControl(user.telNumber),
      isAdmin: new FormControl(user.isAdmin),
      hasMailing: new FormControl(user.hasMailing),
      jobPosition: new FormControl(null),
      subdivision: new FormControl(null),
      whenCreated: new FormControl(user.whenCreated)
    });
    this.profileForm.disable();
  }

  private getUserInfo(): void {
    const jobPositions$ = this.dictionaryApi.getAll('jobPosition');
    const subdivisions$ = this.dictionaryApi.getAll('subdivision');

    forkJoin([jobPositions$, subdivisions$]).subscribe(res => {
      const [jobPositions, subdivisions] = res;
      this.jobPositions = jobPositions;
      this.subdivisions = subdivisions;

      if (!this.profileForm) {
        return;
      }

      const jobPosition = this.jobPositions.find(
        jp => this.selectedUser.jobPosition && jp._id === this.selectedUser.jobPosition._id
      );
      const subdivision = this.subdivisions.find(
        sd => this.selectedUser.subdivision && sd._id === this.selectedUser.subdivision._id
      );

      this.profileForm.patchValue({ jobPosition, subdivision });
    });
  }
}
