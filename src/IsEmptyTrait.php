<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Trait IsEmptyTrait
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
trait IsEmptyTrait {

	/**
	 * @param mixed|null $data
	 *
	 * @return bool
	 */
	protected static function isEmpty( $data = null ) {
		return empty( $data );
	}

}
