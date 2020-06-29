<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Trait ParseArgsRecursiveTrait
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
trait ParseArgsRecursiveTrait {

	/**
	 * Parses recursively arguments with their defaults.
	 *
	 * @param array|object $args
	 * @param array|object $default
	 * @param bool         $preserve_integer_keys
	 *
	 * @return array|object
	 * @noinspection DuplicatedCode
	 */
	protected static function parseArgsRecursive( $args, $default, $preserve_integer_keys = false ) {

		if ( !is_array( $default ) && !is_object( $default ) ) {
			return wp_parse_args( $args, $default );
		}

		$is_object = ( is_object( $args ) || is_object( $default ) );
		$output    = array();

		foreach ( array( $default, $args ) as $elements ) {
			foreach ( (array) $elements as $key => $element ) {
				if ( is_integer( $key ) && !$preserve_integer_keys ) {
					$output[] = $element;
				} elseif (
					isset( $output[ $key ] ) &&
					( is_array( $output[ $key ] ) || is_object( $output[ $key ] ) ) &&
					( is_array( $element ) || is_object( $element ) )
				) {
					$output[ $key ] = self::parseArgsRecursive(
						$element,
						$output[ $key ],
						$preserve_integer_keys
					);
				} else {
					$output[ $key ] = $element;
				}
			}
		}

		return $is_object ? (object) $output : $output;
	}
}
