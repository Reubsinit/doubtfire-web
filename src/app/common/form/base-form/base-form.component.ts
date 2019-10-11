import { OnInit } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { Entity } from 'src/app/api/models/entity';
import { EntityService, HttpOptions } from 'src/app/api/models/entity.service';
import { Observable } from 'rxjs';

export type OnSuccessMethod<T> = (object: T, isNew: boolean) => void;

export class EntityFormComponent<T extends Entity> implements OnInit {

  formData: FormGroup;
  flaggedForEdit: T;
  defaultFormData = {};
  backup = {};

  constructor(controls: { [key: string]: AbstractControl }) {
    this.formData = new FormGroup(controls);
    for (let key in this.formData.controls) {
      if (Object.prototype.hasOwnProperty.call(this.formData.controls, key)) {
        this.defaultFormData[key] = this.formData.get(`${key}`).value;
      }
    }
  }

  ngOnInit() {
  }

  protected cancelEdit() {
    this.formData.reset(this.defaultFormData);
    this.flaggedForEdit = null;
  }

  protected flagEdit(resource: T) {
    this.flaggedForEdit = resource;
    this.copyResourceToForm();
  }

  protected hasChanges(): boolean {
    for (let key in this.formData.controls) {
      if (Object.prototype.hasOwnProperty.call(this.flaggedForEdit, key)) {
        if (this.flaggedForEdit[key] !== this.formData.get(`${key}`).value) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Use the form data to create or update the server with local changes.
   *
   * @param service the entity service used to access the server
   * @param alertService the alert service to provide alerts
   * @param name the name for error and success messages
   */
  protected submit(service: EntityService<T>, alertService: any, name: string, success: OnSuccessMethod<T>) {
    let obs$: Observable<T>;
    if (this.formData.valid) {
      if (this.flaggedForEdit && this.hasChanges()) { // edit
        this.copyChangesFromForm();
        obs$ = service.update(this.flaggedForEdit);
      } else if (!this.flaggedForEdit) { // new
        obs$ = service.create({ campus: this.formDataToObject() });
      } else {
        alertService.add('danger', `${name} was not changed`, 6000);
        return;
      }

      obs$.subscribe(
        (result: T) => {
          alertService.add('success', `${name} saved`, 2000);
          success(result, this.flaggedForEdit ? false : true);
          this.flaggedForEdit = null;
          this.backup = {};
          this.formData.reset(this.defaultFormData);
        },
        error => {
          alertService.add('danger', `${name} save failed: ${error}`, 6000);
        }
      );
    } else {
      this.formData.markAllAsTouched();
    }
  }

  protected getFormDataChanges() {
    let changes = {};
    for (let key in this.formData.controls) {
      if (Object.prototype.hasOwnProperty.call(this.flaggedForEdit, key)) {
        if (this.flaggedForEdit[key] !== this.formData.get(`${key}`).value) {
          changes[key] = this.formData.get(`${key}`).value;
        }
      }
    }
    return changes;
  }

  protected copyChangesFromForm() {
    let changes = this.getFormDataChanges();
    for (let key in changes) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        this.backup[key] = this.flaggedForEdit[key];
        this.flaggedForEdit[key] = changes[key];
      }
    }
  }

  protected copyResourceToForm() {
    for (let key in this.flaggedForEdit) {
      if (Object.prototype.hasOwnProperty.call(this.flaggedForEdit, key) && this.formData.get(`${key}`)) {
        this.formData.get(`${key}`).setValue(this.flaggedForEdit[key]);
      }
    }
  }

  protected formDataToObject(): Object {
    let result = {};
    for (let key in this.formData.controls) {
      if (Object.prototype.hasOwnProperty.call(this.formData.controls, key)) {
        result[key] = this.formData.get(`${key}`).value;
      }
    }
    return result;
  }

  editing(resource): boolean {
    return this.flaggedForEdit === resource;
  }
}
