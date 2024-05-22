import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "hufCurrencyPipe",
  standalone: true,
})
export class HufCurrencyPipe implements PipeTransform {
    transform(value: number | string | null | undefined): string | null {
        if (value == null || isNaN(+value)) return null;

        // Convert the value to a number and round to two decimal places
        const numberValue = parseFloat(value.toString());
        const roundedValue = numberValue.toFixed(2);

        // Split the integer and fractional parts
        const [integerPart, fractionalPart] = roundedValue.split(".");

        // Format the integer part with spaces as thousand separators
        const formattedIntegerPart = integerPart.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            " ",
        );

        // Combine the formatted integer part with the fractional part if not ,00
        const formattedValue =
            fractionalPart === "00"
                ? formattedIntegerPart
                : `${formattedIntegerPart},${fractionalPart}`;

        return `${formattedValue} Ft`;
    }
}
