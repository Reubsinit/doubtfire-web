import { Component, Input, Inject, ViewChild } from '@angular/core';
import { alertService } from 'src/app/ajs-upgraded-providers';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { Tutorial } from 'src/app/api/models/tutorial/tutorial';
import { EntityFormComponent } from 'src/app/common/entity-form/entity-form.component';
import { TutorialService } from 'src/app/api/models/tutorial/tutorial.service';
import { FormControl, Validators, ControlValueAccessor } from '@angular/forms';
import { Campus } from 'src/app/api/models/campus/campus';
import { CampusService } from 'src/app/api/models/campus/campus.service';
import { User } from 'src/app/api/models/user/user';

@Component({
  selector: 'unit-tutorials-list',
  templateUrl: 'unit-tutorials-list.component.html',
  styleUrls: ['unit-tutorials-list.component.scss']
})
export class UnitTutorialsListComponent extends EntityFormComponent<Tutorial> {
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() unit: any;

  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  campuses: Campus[] = new Array<Campus>();
  columns: string[] = ['abbreviation', 'campus', 'location', 'day', 'time', 'tutor', 'capacity', 'options'];
  tutorials: Tutorial[] = new Array<Tutorial>();
  dataSource = new MatTableDataSource(this.tutorials);

  constructor(
    private tutorialService: TutorialService,
    private campusService: CampusService,
    @Inject(alertService) private alerts: any,
  ) {
    super({
      meeting_day: new FormControl('', [
        Validators.required
      ]),
      meeting_time: new FormControl(null, [
        Validators.required
      ]),
      meeting_location: new FormControl('', [
        Validators.required
      ]),
      abbreviation: new FormControl('', [
        Validators.required
      ]),
      campus: new FormControl(null, [
        Validators.required
      ]),
      capacity: new FormControl('', [
        Validators.required
      ]),
      tutor: new FormControl(null, [
        Validators.required
      ]),
    });
  }

  ngOnInit() {
    // Get the campuses
    // TODO: These need to be cached on bootstrap
    this.campusService.query().subscribe(campuses => {
      this.campuses.push(...campuses);
    });
    this.tutorials.push(...this.unit.tutorials);
    // Here we have some mapping functions
    // that define how we send a Tutorial's
    // Tutor and Campus. For example, for Tutor
    // we only need to send the Tutor's id denoted
    // by the key tutor_id
    this.formDataMapping = {
      tutor: (data: Object) => {
        return { tutor_id: data['id'] };
      },
      campus: (data: Object) => {
        return { campus_id: data['id'] };
      },
    };
  }

  // This method is passed to the submit method on the parent
  // and is only run when an entity is successfully created or updated
  onSuccess(response: Tutorial, isNew: boolean) {
    if (isNew) {
      this.pushToTable(response);
    }
  }

  // Push the values that will be displayed in the table
  // to the datasource
  private pushToTable(value: Tutorial | Tutorial[]) {
    value instanceof Array ? this.tutorials.push(...value) : this.tutorials.push(value);
    this.dataSource.sort = this.sort;
    this.table.renderRows();
  }

  // This method is called when the form is submitted,
  // which then calls the parent's submit.
  submit() {
    super.submit(this.tutorialService, this.alerts, this.onSuccess.bind(this), { unit_id: this.unit.id });
  }

  // This comparison function is required to determine what campus or user
  // to render in the associated mat-select components when editing a
  // tutorial. The function is bound to the compareFn attribute on the related
  // mat-selects.
  // See: https://angular.io/api/forms/SelectControlValueAccessor
  compareSelection(aEntity: User | Campus, bTutor: User | Campus) {
    return aEntity && bTutor ? aEntity.id === bTutor.id : aEntity === bTutor;
  }
}
