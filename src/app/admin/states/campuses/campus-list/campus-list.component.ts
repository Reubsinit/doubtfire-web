import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { alertService } from 'src/app/ajs-upgraded-providers';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { CampusService } from 'src/app/api/models/campus/campus.service';
import { Campus } from 'src/app/api/models/campus/campus';
import { EntityFormComponent } from 'src/app/common/form/base-form/base-form.component';

interface FormChanges {
  changed: boolean;
  changes: {};
}

@Component({
  selector: 'campus-list',
  templateUrl: 'campus-list.component.html',
  styleUrls: ['campus-list.component.scss']
})
export class CampusListComponent extends EntityFormComponent<Campus> {
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  syncModes = ['timetable', 'automatic', 'manual'];

  // Set up the table
  columns: string[] = ['name', 'abbreviation', 'mode', 'options'];
  campuses: Campus[] = new Array<Campus>();
  dataSource = new MatTableDataSource(this.campuses);

  constructor(
    private campusService: CampusService,
    // tslint:disable-next-line: no-shadowed-variable
    @Inject(alertService) private alertService: any
  ) {
    super({
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
  }

  ngOnInit() {
    this.campusService.query().subscribe((campuses) => {
      this.campuses.push(...campuses);
      this.table.renderRows();
    });
  }

  delete(campus: Campus) {
    this.campusService.delete(campus).subscribe(
      () => this.flaggedForEdit = null,
      error => this.alertService.add('danger', error, 6000));
  }

  onSuccess(response: Campus, isNew: boolean) {
    if (isNew) {
      this.campuses.push(response);
      this.table.renderRows();
    }
  }

  submit() {
    super.submit(this.campusService, this.alertService, 'Campus', this.onSuccess.bind(this));
  }
}
