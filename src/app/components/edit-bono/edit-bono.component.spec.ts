import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBonoComponent } from './edit-bono.component';

describe('EditBonoComponent', () => {
  let component: EditBonoComponent;
  let fixture: ComponentFixture<EditBonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBonoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
