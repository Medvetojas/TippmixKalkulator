import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';
import { HufCurrencyPipe } from "../pipes/huf-currency.pipe";

@Component({
    selector: 'betting-slip-calculator',
    templateUrl: './betting-slip-calculator.component.html',
    styleUrl: './betting-slip-calculator.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        HufCurrencyPipe
    ]
})
export class BettingSlipCalculatorComponent implements OnInit {
  bettingSlipForm!: FormGroup;
  arrayOfNumbers: number[] = [];

  totalWinnings: number = 0;
  totalProfit: number = 0;
  totalValueOfBetSlip: number = 0;

  specialTypesWithoutSingle = [
    { name: 'Trixie', events: 3, value: false },
    { name: 'Yankee', events: 4, value: false },
    { name: 'Canadian', events: 5, value: false },
    { name: 'Heinz', events: 6, value: false }
  ];

  specialTypesWithSingle = [
    { name: 'Patent', events: 3, value: true },
    { name: 'Lucky 15', events: 4, value: true },
    { name: 'Lucky 31', events: 5, value: true },
    { name: 'Lucky 63', events: 6, value: true },
    { name: 'Super Heinz', events: 7, value: true },
    { name: 'Goliath', events: 8, value: true }
  ];

  constructor(private fb: FormBuilder, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.bettingSlipForm = this.fb.group({
      betType: ['', Validators.required],
      specialBetType: [''],
      combinationBetType: [''],
      stakePerBet: [300, Validators.required],
      events: this.fb.array([this.createEvent()])
    });

    this.bettingSlipForm.get('specialBetType')!.disable();
    this.bettingSlipForm.get('combinationBetType')!.disable();

    this.events.valueChanges.subscribe(() => this.updateArrayOfNumbers());
    this.bettingSlipForm.valueChanges.subscribe(() => this.submitBettingSlip());
  }

  get events() {
    return this.bettingSlipForm.get('events') as FormArray;
  }

  get betType() {
    return this.bettingSlipForm.get('betType')!.value;
  }

  addEvent() {
    this.events.push(this.createEvent());
  }

  addException() {
    throw new Error('Method not implemented.');
  }

  removeEvent() {
    this.events.removeAt(this.events.length - 1);
  }

  createEvent() {
    return this.fb.group({
      odds: ['', [Validators.required, Validators.min(1.00)]],
      won: [false]
    });
  }

  updateArrayOfNumbers() {
    this.arrayOfNumbers = Array.from({ length: this.events.length }, (_, i) => i + 1);

    this.bettingSlipForm.get('betType')!.valueChanges.subscribe(value => {
      if (value === 'Combination') {
        this.bettingSlipForm.get('specialBetType')!.setValue(null);
        this.bettingSlipForm.get('specialBetType')!.disable();
        this.bettingSlipForm.get('combinationBetType')!.enable();
      } else if (value === 'Special') {
        this.bettingSlipForm.get('combinationBetType')!.setValue(null);
        this.bettingSlipForm.get('combinationBetType')!.disable();
        this.bettingSlipForm.get('specialBetType')!.enable();
      } else {
        this.bettingSlipForm.get('specialBetType')!.setValue(null);
        this.bettingSlipForm.get('specialBetType')!.disable();
        this.bettingSlipForm.get('combinationBetType')!.setValue(null);
        this.bettingSlipForm.get('combinationBetType')!.disable();
      }
    });
  }

  calculateMaxCombinations(n: number, r: number): number {
    return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
  }

  factorial(n: number): number {
    return n <= 1 ? 1 : n * this.factorial(n - 1);
  }

  submitBettingSlip(): void {
    if (this.bettingSlipForm.invalid) return;

    this.totalWinnings = 0;
    this.totalValueOfBetSlip = 0;

    switch (this.betType) {
      case 'Single':
        this.calculateSingle();
        break;
      case 'Multi':
        this.calculateMulti();
        break;
      case 'Combination':
        this.calculateCombination();
        break;
      case 'Special':
        this.calculateSpecial();
        break;
    }

    this.totalProfit = this.totalWinnings - this.totalValueOfBetSlip;
  }

  calculateSingle() {
    const stakePerBet = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    this.totalValueOfBetSlip = this.events.length * stakePerBet;

    this.events.controls.forEach(event => {
      if (event.get('won')?.value) {
        this.totalWinnings += stakePerBet * (event.get('odds')?.value || 0);
      }
    });
  }

  calculateMulti() {
    const stakePerBet = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    const oddsMultiplier = this.events.controls.reduce((acc, event) => acc * (event.get('odds')?.value || 1), 1);
    const isBetWon = this.events.controls.every(event => event.get('won')?.value);

    this.totalValueOfBetSlip = stakePerBet;
    this.totalWinnings = isBetWon ? stakePerBet * oddsMultiplier : 0;
  }

  calculateCombination() {
    const stakePerBet = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    const combinationBetType = this.bettingSlipForm.get('combinationBetType')?.value || 0;
    const combinations = this.generateCombinations(this.events.controls, combinationBetType);

    combinations.forEach(combination => {
      const combinedOdds = combination.reduce((acc, event) => acc * (event.get('odds')?.value || 1), 1);
      const isWon = combination.every(event => event.get('won')?.value);

      this.totalValueOfBetSlip += stakePerBet;
      if (isWon) this.totalWinnings += stakePerBet * combinedOdds;
    });
  }

  calculateSpecial() {
    const stakePerBet = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    const specialBetType = this.bettingSlipForm.get('specialBetType')?.value || false;
    const startCombinationSize = specialBetType ? 1 : 2;

    for (let size = startCombinationSize; size <= this.events.length; size++) {
      this.generateCombinations(this.events.controls, size).forEach(combination => {
        const combinedOdds = combination.reduce((acc, event) => acc * (event.get('odds')?.value || 1), 1);
        const isWon = combination.every(event => event.get('won')?.value);

        this.totalValueOfBetSlip += stakePerBet;
        if (isWon) this.totalWinnings += stakePerBet * combinedOdds;
      });
    }
  }

  generateCombinations(sourceArray: any[], combinationLength: number): any[][] {
    if (combinationLength > sourceArray.length) return [];
    const combinations: any[][] = [];
    const combination: any[] = new Array(combinationLength);

    const innerFunc = (start: number, depth: number) => {
      for (let i = start; i < sourceArray.length - combinationLength + depth + 1; i++) {
        combination[depth] = sourceArray[i];
        if (depth === combinationLength - 1) {
          combinations.push([...combination]);
        } else {
          innerFunc(i + 1, depth + 1);
        }
      }
    };

    innerFunc(0, 0);
    return combinations;
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
}
