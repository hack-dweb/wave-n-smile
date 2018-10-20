import './rxjs-extensions';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {MainRoutingModule} from './main.routes';
import {HttpClientModule} from '@angular/common/http';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {MainComponent} from './components/main';
import {Ipfs} from '../ipfs/services/ipfs';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MainRoutingModule
  ],
  declarations: [
    MainComponent
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}, Ipfs],
  entryComponents: [],
  bootstrap: [MainComponent]
})
export class MainModule {

  constructor() {
  }

}
