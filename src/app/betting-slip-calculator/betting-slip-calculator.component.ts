import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';

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
    MatCheckboxModule,
    MatDialogModule
  ],
  templateUrl: './betting-slip-calculator.component.html',
  styleUrl: './betting-slip-calculator.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class BettingSlipCalculatorComponent implements OnInit {
  bettingSlipForm!: FormGroup;
  arrayOfNumbers: number[] = [];

  totalWinnings: number = 0;
  totalProfit: number = 0;
  totalValueOfBetSlip: number = 0;

  constructor(private fb: FormBuilder, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.bettingSlipForm = new FormGroup({
      betType: new FormControl('', Validators.required),
      specialBetType: new FormControl(''),
      combinationBetType: new FormControl(''),
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

    this.bettingSlipForm.valueChanges.subscribe(() => {
      if(this.bettingSlipForm.valid){
        this.submitBettingSlip();
      }
    })
  }

  get events() {
    return this.bettingSlipForm.get('events') as FormArray;
  }

  get betType() {
    return this.bettingSlipForm.get('betType')!.value;
  }

  triggerTutorialDialog() {
    this.dialog.open(InstructionsModalComponent);
  }

  addEvent() {
    const newEvent = this.fb.group({
      odds: ['', [Validators.required, Validators.min(1.00)]],
      won: [false]
    });
    this.events.push(newEvent);
  }

  removeEvent() {
    this.events.removeAt(this.events.length - 1);
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

  calculateMaxCombinations(n: number, r: number): number {
    return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
  }

  submitBettingSlip(): void {
      this.totalWinnings = 0;
      this.totalProfit = 0;
      this.totalValueOfBetSlip = 0;

      if(this.betType == "Single"){
        this.calculateSingle();
      } else if(this.betType == "Multi"){
        this.calculateMulti();
      } else if(this.betType == "Combination"){
        this.calculateCombination();
      } else {
        this.calculateSpecial();
      }

      this.totalProfit = this.totalWinnings - this.totalValueOfBetSlip;
  }

  calculateSingle(){
    const stakePerBet: number = this.bettingSlipForm.get('stakePerBet')?.value || 0;

    this.totalValueOfBetSlip = this.events.length * stakePerBet;
    this.totalWinnings = 0;

    this.events.controls.forEach(event => {
      const odds = event.get('odds')?.value || 0;
      const won = event.get('won')?.value || false;

      if (won) {
        this.totalWinnings += stakePerBet * odds;
      }
    });

    this.totalProfit = this.totalWinnings - this.totalValueOfBetSlip;
  }

  calculateMulti(){
    const stakePerBet: number = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    let isBetWon = true;
    let oddsMultiplier = 1;

    this.events.controls.forEach(event => {
      const odds = event.get('odds')?.value || 0;
      const won = event.get('won')?.value || false;

      if (!won) {
        isBetWon = false;
        return;
      }

      oddsMultiplier *= odds;
    });

    if (isBetWon && oddsMultiplier > 1) {
        this.totalWinnings = stakePerBet * oddsMultiplier;
        this.totalValueOfBetSlip = stakePerBet;
    } else {
        this.totalWinnings = 0;
        this.totalValueOfBetSlip = stakePerBet;
    }
  }

  calculateCombination(): void {
    const events = this.bettingSlipForm.get('events') as FormArray;
    const stakePerBet: number = this.bettingSlipForm.get('stakePerBet')?.value || 0;
    const combinationBetType: number = this.bettingSlipForm.get('combinationBetType')?.value || 0;
  
    const generateCombinations = (sourceArray: AbstractControl[], combinationLength: number) => {
      const sourceLength = sourceArray.length;
      if (combinationLength > sourceLength) return [];
  
      const combinations: AbstractControl[][] = [];
      const combination: AbstractControl[] = [];
  
      const innerFunc = (start: number, depth: number) => {
        for (let i = start; i < sourceLength - combinationLength + depth + 1; i++) {
          combination[depth] = sourceArray[i];
  
          if (depth < combinationLength - 1) {
            innerFunc(i + 1, depth + 1);
          } else {
            combinations.push([...combination]);
          }
        }
      };
  
      innerFunc(0, 0);
      return combinations;
    };
  
    const combinations = generateCombinations(events.controls, combinationBetType);
  
    combinations.forEach(combination => {
      const combinedOdds = combination.reduce((odds, event) => odds * event.get('odds')!.value, 1);
      const isWon = combination.every(event => event.get('won')!.value);
  
      this.totalValueOfBetSlip += stakePerBet;
  
      if (isWon) {
        const winnings = stakePerBet * combinedOdds;
        this.totalWinnings += winnings;
      }
    });
  }
  

  calculateSpecial(): void {
  const events = this.bettingSlipForm.get('events') as FormArray;
  const specialBetType: boolean = this.bettingSlipForm.get('specialBetType')?.value || false;
  const stakePerBet: number = this.bettingSlipForm.get('stakePerBet')?.value || 0;
  const totalEvents = events.length;

  const generateCombinations = (sourceArray: AbstractControl[], combinationLength: number): AbstractControl[][] => {
    const combinations: AbstractControl[][] = [];
    const combination: AbstractControl[] = new Array(combinationLength);

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
  };

  const startCombinationSize = specialBetType ? 1 : 2;

  for (let combinationSize = startCombinationSize; combinationSize <= totalEvents; combinationSize++) {
    generateCombinations(events.controls, combinationSize).forEach(combination => {
      const combinedOdds = combination.reduce((odds, event) => odds * event.get('odds')!.value, 1);
      const isWon = combination.every(event => event.get('won')!.value);

      this.totalValueOfBetSlip += stakePerBet;

      if (isWon) {
        const winnings = stakePerBet * combinedOdds;
        this.totalWinnings += winnings;
      }
    });
  }
}
}
