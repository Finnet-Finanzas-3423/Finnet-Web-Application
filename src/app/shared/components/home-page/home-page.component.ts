import { Component } from '@angular/core';
import {WelcomeComponent} from '../../../components/welcome/welcome.component';
import {ToolbarComponent} from '../toolbar/toolbar.component';
import {FooterComponent} from '../footer/footer.component';

@Component({
  selector: 'app-home-page',
  imports: [
    WelcomeComponent,
    ToolbarComponent,
    FooterComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

}
