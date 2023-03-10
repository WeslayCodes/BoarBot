/**
 * {@link FormatStrings FormatStrings.ts}
 *
 * Handles discord timestamp formatting.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export class FormatStrings {
    /**
     * Converts a timestamp to relative time using Discord's formatted strings
     *
     * @param timestamp - The timestamp to convert
     */
    public static toRelTime(timestamp: number) { return `<t:${timestamp}:R>`; }

    /**
     * Converts a channel ID into a clickable channel link using Discord's formatted strings
     *
     * @param id - The channel ID to convert
     */
    public static toBasicChannel(id: string) { return `<#${id}>`; }
}