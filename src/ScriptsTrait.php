<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Trait ScriptsTrait
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
trait ScriptsTrait {

	/**
	 * @var bool $scripts_enqueued
	 */
	protected static $scripts_enqueued;

	/**
	 * @var array $scripts
	 */
	protected static $scripts;

	/**
	 * @return array|array[]
	 */
	protected static function defaultScripts(): array {
		return array(
			'css' => array(),
			'js'  => array(),
		);
	}

	/**
	 * Loads scripts in WP if necessary.
	 */
	protected static function maybeEnqueueScripts() {
		if ( !self::isScriptsEnqueued() ) {
			/**
			 * @var string $type
			 * @var array  $scripts
			 */
			foreach ( self::getScripts() as $type => $scripts ) {
				switch ( $type ) {
					case 'css':
						$callback = 'wp_enqueue_style';
						break;
					case 'js':
					default:
						$callback = 'wp_enqueue_script';
						break;
				}
				/** @var array $script */
				foreach ( $scripts as $script ) {
					call_user_func_array( $callback, $script );
				}
			}
			self::setScriptsEnqueued( true );
		}
	}

	/**
	 * @return bool
	 */
	protected static function isScriptsEnqueued(): bool {
		return (bool) self::$scripts_enqueued;
	}

	/**
	 * @param bool $scripts_enqueued
	 */
	protected static function setScriptsEnqueued( bool $scripts_enqueued ): void {
		self::$scripts_enqueued = $scripts_enqueued;
	}

	/**
	 * @return array
	 */
	protected static function getScripts(): array {
		if ( !is_array( self::$scripts ) ) {
			self::setScripts( array() );
		}

		return self::$scripts;
	}

	/**
	 * @param array $scripts
	 */
	protected static function setScripts( array $scripts ): void {
		self::$scripts = wp_parse_args( $scripts, self::defaultScripts() );
	}

	/**
	 * @param string $path
	 *
	 * @return string
	 * @noinspection PhpUnused
	 */
	protected static function pathToUrl( string $path ): string {
		return esc_url_raw(
			str_replace(
				wp_normalize_path( untrailingslashit( ABSPATH ) ),
				site_url(),
				wp_normalize_path( $path )
			),
			array( 'http', 'https' )
		);
	}

	/**
	 * @param $url
	 *
	 * @return string
	 * @noinspection PhpUnused
	 */
	protected static function maybeMinify( $url ) {
		$min = self::min();

		return empty( $min ) ?
			$url
			: preg_replace( '/(?<!\.min)(\.js|\.css)/', "{$min}$1", $url );
	}

	/**
	 * Returns .min if script debug is not enabled.
	 *
	 * @return string
	 */
	protected static function min() {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
	}

}
