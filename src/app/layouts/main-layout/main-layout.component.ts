import { Component } from '@angular/core';
import {ToolbarComponent} from '../../shared/components/toolbar/toolbar.component';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    ToolbarComponent,
    RouterOutlet,
    FooterComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

}
