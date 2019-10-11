import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { alertService } from 'src/app/ajs-upgraded-providers';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { CampusService } from 'src/app/api/models/campus/campus.service';
import { Campus } from 'src/app/api/models/campus/campus';

interface FormChanges {
  changed: boolean;
  changes: {};
}

@Component({
  selector: 'campus-list',
  templateUrl: 'campus-list.component.html',
  styleUrls: ['campus-list.component.scss']
})
export class CampusListComponent implements OnInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  syncModes = ['timetable', 'automatic', 'manual'];

  campusForm = new FormGroup({
    abbreviation: new FormControl('', [
      Validators.required
    ]),
    name: new FormControl('', [
      Validators.required
    ]),
    mode: new FormControl('', [
      Validators.required
    ])
  });

  // Set up the table
  columns: string[] = ['name', 'abbreviation', 'mode', 'options'];
  campuses: Campus[] = new Array<Campus>();
  dataSource = new MatTableDataSource(this.campuses);
  selectedCampus: Campus;

  constructor(
    private campusService: CampusService,
    // tslint:disable-next-line: no-shadowed-variable
    @Inject(alertService) private alertService: any
  ) { }

  private clearFormControls() {
    this.campusForm.reset({
      name: '',
      abbreviation: '',
      mode: ''
    });
  }

  private campusChanges(campus): FormChanges {
    let result = { changed: false, changes: {} } as FormChanges;
    for (let key in campus) {
      if (key === 'id') { continue; }
      if (Object.prototype.hasOwnProperty.call(campus, key)) {
        if (campus[key] !== this.campusForm.get(`${key}`).value) {
          // this.campusForm[`${key}.orig`] = campus[key];
          result.changes[key] = this.campusForm.get(`${key}`).value;
        }
      }
    }
    if (Object.entries(result.changes).length !== 0) {
      result.changed = true;
    }
    return result;
  }

  private assignUpdatedValues(changes, campus) {
    for (let key in changes) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        // this.campusForm[`${key}.orig`] = campus[key];
        campus[key] = changes[key];
      }
    }
  }

  ngOnInit() {
    this.campusService.query().subscribe((campuses) => {
      this.campuses.push(...campuses);
      this.table.renderRows();
    });
  }

  update(campus: Campus) {
    if (this.campusForm.valid) {
      debugger;
      const changes = this.campusChanges(campus);
      if (changes.changed) {
        this.assignUpdatedValues(changes.changes, campus);
        this.campusService.update(campus).subscribe(
          () => {
            this.alertService.add('success', 'Campus edited', 2000);
          },
          error => {
            this.alertService.add('danger', `Campus edit failed: ${error}`, 2000);
          });
        this.selectedCampus = null;
        this.clearFormControls();
      } else {
        this.alertService.add('danger', 'Campus was not changed', 2000);
      }
    } else {
      this.campusForm.markAllAsTouched();
    }
  }

  delete(campus: Campus) {
    this.campusService.delete(campus).subscribe(
      () => this.selectedCampus = null,
      error => this.alertService.add('danger', error, 6000));

  }

  saveNew() {
    if (this.campusForm.valid) {
      // Get the new campus valus from the form group
      const newCampus = new Campus({
        abbreviation: this.campusForm.get('abbreviation').value,
        name: this.campusForm.get('name').value,
        mode: this.campusForm.get('mode').value
      });

      this.campusService.create(newCampus).subscribe(
        result => {
          this.alertService.add('success', 'Campus created', 2000);
          this.campuses.push(result);
          this.table.renderRows();
          this.clearFormControls();
        },
        error => {
          this.alertService.add('danger', `Failed to create campus: ${error}`, 2000);
        });
    } else {
      this.campusForm.markAllAsTouched();
    }
  }

  cancelEdit() {
    this.clearFormControls();
    this.selectedCampus = null;
  }

  editing(item: Campus): boolean {
    return item === this.selectedCampus;
  }

  flagEdit(item) {
    this.selectedCampus = item;
    this.clearFormControls();
    this.campusForm.patchValue({
      name: item.name,
      abbreviation: item.abbreviation,
      mode: item.mode
    });
    // this.campusForm.get('name').setValue(item.name);
    // this.campusForm.get('abbreviation').setValue(item.abbreviation);
    // this.campusForm.get('mode').setValue(item.mode);
  }
}
