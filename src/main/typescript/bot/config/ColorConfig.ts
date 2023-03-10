/**
 * {@link ColorConfig ColorConfig.ts}
 *
 * Stores number configurations for a bot instance.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export class ColorConfig {
    [colorKey: string]: string;

    public readonly foregroundGray: string = '#000000';
    public readonly font: string = '#000000';

    public readonly badge: string = '#000000';

    public readonly rarity1: string = '#000000';
    public readonly rarity2: string = '#000000';
    public readonly rarity3: string = '#000000';
    public readonly rarity4: string = '#000000';
    public readonly rarity5: string = '#000000';
    public readonly rarity6: string = '#000000';
    public readonly rarity7: string = '#000000';
}