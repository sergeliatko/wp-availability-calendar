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
	public static function PHPDateFormatToJSDatePicker( string $format ): string {
		$rules = array(
			// Day
			'd' => 'dd',
			'D' => 'D',
			'j' => 'd',
			'l' => 'DD',
			'N' => '',
			'S' => '',
			'w' => '',
			'z' => 'o',
			// Week
			'W' => '',
			// Month
			'F' => 'MM',
			'm' => 'mm',
			'M' => 'M',
			'n' => 'm',
			't' => '',
			// Year
			'L' => '',
			'o' => '',
			'Y' => 'yy',
			'y' => 'y',
			// Time
			'a' => '',
			'A' => '',
			'B' => '',
			'g' => '',
			'G' => '',
			'h' => '',
			'H' => '',
			'i' => '',
			's' => '',
			'u' => '',
		);
		$jquery_format = '';
		$escaping      = false;
		for ( $i = 0; $i < strlen( $format ); $i ++ ) {
			$char = $format[ $i ];
			// PHP date format escaping character
			if ( $char === '\\' ) {
				$i ++;
				if ( $escaping ) {
					$jquery_format .= $format[ $i ];
				} else {
					$jquery_format .= "'" . $format[ $i ];
				}
				$escaping = true;
			} else {
				if ( $escaping ) {
					$jquery_format .= "'";
					$escaping      = false;
				}
				if ( isset( $rules[ $char ] ) ) {
					$jquery_format .= $rules[ $char ];
				} else {
					$jquery_format .= $char;
				}
			}
		}

		return $jquery_format;
	}
}
