<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class DateFormatTranslateTrait
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
trait DateFormatTranslateTrait {

	/**
	 * @param string $format
	 *
	 * @return string
	 */
	protected static function PHPDateFormatToJSDatePicker( string $format ): string {
		return str_replace(
			array(
				'Y',
				'm',
				'd',
			),
			array(
				'yy',
				'mm',
				'dd',
			),
			$format
		);
	}
}
