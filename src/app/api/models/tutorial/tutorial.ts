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

const IGNORE = [
  'campus_id',
  'tutor_name',
  'tutor_id'
];

export class Tutorial extends Entity {

  id: number;
  meeting_day: string;
  meeting_time: string;
  abbreviation: string;
  campus: Campus;
  capacity: number;
  num_students: number;
  tutor: User;

  toJson(): any {
    return {
      tutorial: super.toJsonWithKeys(KEYS, {
        tutor_id: (data: Object) => {
          return data['tutor']['id'];
        },
        campus_id: (data: Object) => {
          return data['campus']['id'];
        }
      })
    };
  }

  setFromJson(data: any, keys: string[], ignoredKeys?: string[], maps?: Object): void {
    super.setFromJson(data, keys, ignoredKeys, maps);
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
    this.setFromJson(data, KEYS, IGNORE, {
      tutor: mappingFunction('id', AppInjector.get(UserService)),
      meeting_time: (dateString: string) => {
        const time = new Date(dateString).toLocaleTimeString();
        return time.slice(0, time.lastIndexOf(':'));
      }
    });
  }

  public get key(): string {
    return this.id.toString();
  }
  public keyForJson(json: any): string {
    return json.id;
  }
}

