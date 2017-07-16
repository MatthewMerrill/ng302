import {Component, OnDestroy, OnInit} from "@angular/core";
import {AngularFireDatabase, FirebaseObjectObservable} from "angularfire2/database";
import {Subscription} from "rxjs/Subscription";
import {environment} from "../environments/environment";

@Component({
  selector: 'editor',
  template: `
    <md-card>
      <md-card-content>
        <span>Changing Key does not rename a link, but creates a new one. Remember to delete the old listing if desired.</span>
        <p id="formStatus">{{status}}</p>
        <md-input-container>
          <input mdInput disabled="{{isFrozen}}"
                 [(ngModel)]="formKey" placeholder="Link Key /[_a-zA-Z0-9]+/">
        </md-input-container>
        <md-input-container>
          <input mdInput disabled="{{isFrozen}}"
                 [(ngModel)]="formUrl" placeholder="Target URL">
        </md-input-container>
      </md-card-content>

      <md-card-actions align="end">
        <button md-mini-fab disabled="{{isFrozen}}"
                (click)="submitLink()" color="primary">
          <md-icon>check</md-icon>
        </button>
        <button md-mini-fab disabled="{{isFrozen}}"
                (click)="deleteLink()" color="warn">
          <md-icon>delete</md-icon>
        </button>
      </md-card-actions>
    </md-card>

    <md-card>
      <md-card-content>
        <!--<button md-raised-button color="primary">New Entry</button>-->
        <button *ngFor="let key of keys" title="{{key}} | {{mappings[key]}}"
                md-raised-button
                disabled="{{isFrozen}}"
                color="white"
                (click)="open(key)"
        >{{key}}
        </button>
      </md-card-content>
    </md-card>
  `,
  styles: [
    'md-card { max-width: 30em; margin: 1em auto; }',
    'md-input-container { display: block; }',
    '#formStatus { font-weight: bold; }',
  ]
})
export class EditorComponent implements OnInit, OnDestroy {

  itemObs: FirebaseObjectObservable<{}>;
  itemSub: Subscription;

  mappings = {};
  keys = [];

  formKey: string = '';
  formUrl: string = '';
  status: string = ' ';
  isFrozen: boolean = false;

  constructor(private db: AngularFireDatabase) {
  }

  ngOnInit(): void {
    this.itemObs = this.db.object('/links');
    this.itemSub = this.itemObs.subscribe(this.updateItems.bind(this))
  }

  ngOnDestroy(): void {
    if (this.itemSub) {
      this.itemSub.unsubscribe();
      this.itemSub = null;
    }
  }

  updateItems(value: {}): void {
    this.keys = Object.keys(value);
    for (let key of this.keys) {
      this.mappings[key] = value[key];
    }
  }

  private submitLink() {
    this.isFrozen = true;

    this.formKey = this.formKey.toLowerCase().split(' ').join('_');
    if (!this.formKey.match('^[_a-z0-9]+$')) {
      this.status = 'Only alphabet/number/underscore are allowed in key.';
      this.isFrozen = false;
      return;
    }

    this.status = 'Submitting...';
    this.db.object(`/links/${this.formKey}`).set(this.formUrl)
      .then(() => {
        this.status = 'Submitted!';
        this.isFrozen = false;
      })
      .catch((err) => {
        this.status = `There was an error submitting ${this.formKey}: "${err.name}"`;
        if (!environment.production) {
          console.error(err);
        }
        this.isFrozen = false;
      })
  }

  private deleteLink() {
    this.isFrozen = true;
    this.status = 'Deleting...';
    this.db.object(`/links/${this.formKey}`).set(null)
    .then(() => {
      this.status = 'Deleted!';
      this.isFrozen = false;
    })
    .catch((err) => {
      this.status = `There was an error deleting ${this.formKey}: "${err.name}"`;
      if (!environment.production) {
        console.error(err);
      }
      this.isFrozen = false;
    })
  }

  private open(key: string) {
    this.formKey = key;
    this.formUrl = this.mappings[key] || '';
  }

}
