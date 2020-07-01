<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Interface AvailabilityInterface
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
interface AvailabilityInterface {

	/**
	 * Must return following associative array:
	 * [
	 *      'date'      => string   Date in selected PHP date format.
	 *      'available' => bool     Whether this date is selectable for arrival.
	 *      'arrival'   => bool     Whether arrival is allowed on this date.
	 *      'departure' => bool     Whether departure is allowed on this date.
	 *      'rate'      => string   Minimum nightly rate to display for this date.
	 *      'minStay'   => integer  Minimum selectable number of nights for this arrival date.
	 *      'maxStay'   => integer  Maximum selectable number of nights for this arrival date. 0 - no limit.
	 * ]
	 *
	 * @return array
	 */
	public function __toArray(): array;

	/**
	 * @return string The date in specified PHP format.
	 */
	public function getDate(): string;

}
