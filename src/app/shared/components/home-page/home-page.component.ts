import { Component } from '@angular/core';
import {ToolbarComponent} from '../toolbar/toolbar.component';
import {FooterComponent} from '../footer/footer.component';
import {WelcomeComponent} from '../../../components/welcome/welcome.component';

@Component({
  selector: 'app-home-page',
  imports: [
    ToolbarComponent,
    FooterComponent,
    WelcomeComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

}
