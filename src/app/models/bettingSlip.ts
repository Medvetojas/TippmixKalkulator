import { Event } from "./event";
import { BetType } from "./betType";

export interface BettingSlip {
    countOfEvents: number;
    events: Event[];
    betType: BetType;
    stakePerBet: number;
}
