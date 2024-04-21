import { Component, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-instructions-modal',
  templateUrl: './instructions-modal.component.html',
  styleUrl: './instructions-modal.component.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  encapsulation: ViewEncapsulation.None
})
export class InstructionsModalComponent {

  constructor(public dialogRef: MatDialogRef<InstructionsModalComponent>){

  }

  closeDialog(){
    this.dialogRef.close();
  }
}
