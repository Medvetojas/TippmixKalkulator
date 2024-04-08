import { Component, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'betting-slip-calculator',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './betting-slip-calculator.component.html',
  styleUrl: './betting-slip-calculator.component.scss'
})
export class BettingSlipCalculatorComponent implements OnInit {
  bettingSlipForm!: FormGroup;
  arrayOfNumbers: number[] = [];

  totalWinnings: number = 0;
  totalProfit: number = 0;
  totalValueOfBetSlip: number = 0;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.bettingSlipForm = new FormGroup({
      betType: new FormControl('', Validators.required),
      specialBetType: new FormControl(''),
      combinationBetType:  new FormControl(''),
      stakePerBet: new FormControl(300, Validators.required),
      events: this.fb.array([])
    });

    this.addEvent();

    this.events.valueChanges.subscribe(() => {
      if(this.events.length >= 3){
        this.arrayOfNumbers = Array.from({length: this.events.length}, (_, i) => i + 1);
      }

      if(this.events.length > 8 && this.bettingSlipForm.get('betType')!.value == "Special" ){
        this.bettingSlipForm.get('betType')!.setValue("Single");
      }
    });

    this.bettingSlipForm.get('specialBetType')!.disable();
    this.bettingSlipForm.get('combinationBetType')!.disable();

    this.bettingSlipForm.get('betType')!.valueChanges.subscribe(value => {
      if (value === 'Combination') {
        this.bettingSlipForm.get('specialBetType')!.disable();
        this.bettingSlipForm.get('combinationBetType')!.enable();
      } else if (value === 'Special') {
        this.bettingSlipForm.get('combinationBetType')!.disable();
        this.bettingSlipForm.get('specialBetType')!.enable();
      } else {
        this.bettingSlipForm.get('specialBetType')!.disable();
        this.bettingSlipForm.get('combinationBetType')!.disable();
      }
    });
  }

  get events() {
    return this.bettingSlipForm.get('events') as FormArray;
  }

  addEvent(): void {
    const newEvent = this.fb.group({
      id: [this.events.length + 1, Validators.required],
      odds: ['', [Validators.required, Validators.min(1.00)]],
      won: [false]
    });
    this.events.push(newEvent);
  }

  getCorrectSuffix(): string {
    const lastDigit = this.events.length % 10;
  
    if(this.events.length == 10){
      return '-es'
    } else if(this.events.length == 20){
      return '-as'
    }

    switch (lastDigit) {
      case 1:
      case 2:
      case 4:
      case 7:
      case 9:
        return '-es';
      case 3:
      case 8:
        return '-as';
      case 5:
        return '-ös';
      case 6:
        return '-os';
      default:
        return '-es';
    }
  }

  factorial(n: number): number {
    let result: number = 1;
    for (let i: number = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
  
  calculateCombinations(n: number, r: number): number {
    return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
  }

  submitBettingSlip(): void {
    if (this.bettingSlipForm.valid) {
      console.log(this.bettingSlipForm.value);
    }
  }

  calculateSingles(){

  }

  calculateMulti(){

  }

  calculateSpecial(){}
}
