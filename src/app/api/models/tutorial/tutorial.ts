import { Entity, TypeMapFunction } from '../entity';
import { User } from '../user/user';
import { UserService } from '../user/user.service';
import { AppInjector } from '../../../app-injector';
import { Campus } from '../campus/campus';
import { CampusService } from '../campus/campus.service';

const KEYS =
  [
    'id',
    'meeting_day',
    'meeting_time',
    'meeting_location',
    'abbreviation',
    'campus_id',
    'capacity',
    'tutor_name',
    'tutor_id',
    'num_students',
    'tutor',
  ];

export class Tutorial extends Entity {

  id: number;
  meeting_day: string;
  meeting_time: Date;
  abbreviation: string;
  campus: Campus;
  capacity: number;
  tutor_name: string;
  num_students: number;
  tutor: User;

  constructor(initialData?: any) {
    super();
    if (initialData) {
      this.updateFromJson(initialData);
    }
  }

  toJson(): any {
    return {
      tutorial: super.toJsonWithKeys(KEYS, {
        tutor_id: (data: Object) => {
          return data['tutor']['user_id'];
        },
        campus_id: (data: Object) => {
          return data['campus']['id'];
        }
      })
    };
  }

  setFromJson(data: any, keys: string[], maps?: Object): void {
    super.setFromJson(data, keys, maps);
    if (data.campus_id) {
      AppInjector.get(CampusService).get(data.campus_id).subscribe(campus => {
        this.campus = campus;
      });
    }
  }

  public updateFromJson(data: any): void {
    const mappingFunction = (key: string, service: any) => {
      let result: TypeMapFunction;
      result = (json: any) => {
        if (json[key]) {
          let resource;
          service.get(json[key]).subscribe(response => {
            resource = response;
          });
          return resource;
        }
      };
      return result;
    };
    this.setFromJson(data, KEYS, {
      tutor: mappingFunction('id', AppInjector.get(UserService))
    });
  }

  public get key(): string {
    return this.id.toString();
  }
  public keyForJson(json: any): string {
    return json.id;
  }
}

