import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {AngularFireAuth} from "angularfire2/auth";
import {Observable} from "rxjs/Observable";
import * as firebase from 'firebase/app';
import {Subscription} from "rxjs/Subscription";
import {environment} from "app/../environments/environment";

@Component({
  selector: 'app-root',
  template: `
    <md-toolbar color="primary">
      <span>{{title}}</span>
      <button *ngIf="!loggedIn" md-button (click)="login()">Log In</button>
      <button *ngIf="loggedIn" md-button (click)="logout()">Log Out</button>
    </md-toolbar>

    <md-card *ngIf="!loggedIn">
      <md-card-title>Please log in as a registered admin.</md-card-title>
      <button md-raised-button (click)="login()">Login</button>
    </md-card>
    
    <md-card *ngIf="loggedIn && (isAdmin == null)">
      <md-card-title>Authenticating...</md-card-title>
      <md-card-content>
        <md-progress-spinner strokeWidth="6" mode="indeterminate"></md-progress-spinner>
      </md-card-content>
    </md-card>

    <md-card *ngIf="loggedIn && (isAdmin == false)">
      <md-card-title><md-icon>warning</md-icon><span> Forbidden</span></md-card-title>
      <md-card-content>
        <p>You are not authorized to use this service.
          Reach out to an admin if you believe this is a mistake.</p>
        
        <p>Ask them to whitelist:<strong>{{uid}}</strong></p>
      </md-card-content>
      <button md-raised-button (click)="logout()">Log Out</button>
    </md-card>

    
    <md-tab-group *ngIf="loggedIn && (isAdmin == true)">
      <md-tab label="Link Editor"><editor></editor></md-tab>
      <md-tab label="Admin List"><h1>TODO</h1></md-tab>
    </md-tab-group>
  `,
  styles: [
    'md-toolbar button {margin-left: auto; }',
    'md-card { max-width: 40em; margin: 1em auto 0; }',
    'md-progress-spinner { margin: 0 auto; }'
  ]
})
export class AppComponent implements OnInit, OnDestroy {

  title: string;

  userObservable: Observable<firebase.User>;
  userSubscription: Subscription;
  uid: string = null;
  loggedIn: boolean = false;

  isAdmin: Boolean = null;
  adminSubscription: Subscription;

  constructor(private db: AngularFireDatabase, public afAuth: AngularFireAuth) {
    this.title = environment.title;
    this.userObservable = afAuth.authState;
  }

  ngOnInit(): void {
    this.userSubscription = this.userObservable.subscribe(this.updateUser.bind(this));
  }

  ngOnDestroy(): void {
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
      this.adminSubscription = null;
    }
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }

  updateUser(user) {
    this.loggedIn = user;

    if (user) {
      this.uid = user.uid;

      this.isAdmin = null;
      setTimeout(() => this.adminSubscription = this.db.object(`admins/${user.uid}`).subscribe((adminIfExists) => {
        this.isAdmin = adminIfExists.$exists();
      }), 750);
    }
    else {
      this.uid = null;

      if (this.adminSubscription) {
        this.adminSubscription.unsubscribe();
        this.adminSubscription = null;
      }
    }
  }

}
