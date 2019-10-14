import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { alertService } from 'src/app/ajs-upgraded-providers';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { CampusService } from 'src/app/api/models/campus/campus.service';
import { Campus } from 'src/app/api/models/campus/campus';
import { EntityFormComponent } from 'src/app/common/form/base-form/base-form.component';

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
      this.pushToTable(campuses);
    });
  }

  onSuccess(response: Campus, isNew: boolean) {
    if (isNew) {
      this.pushToTable(response);
    }
  }

  private pushToTable(value: Campus | Campus[]) {
    value instanceof Array ? this.campuses.push(...value) : this.campuses.push(value);
    this.dataSource.sort = this.sort;
    this.table.renderRows();
  }

  submit() {
    super.submit(this.campusService, this.alertService, this.onSuccess.bind(this));
  }
}
