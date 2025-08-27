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
	protected static bool $scripts_enqueued = false;

	/**
	 * @var array|null $scripts
	 */
	protected static ?array $scripts = null;

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
	protected static function maybeEnqueueScripts(): void {
		if ( ! static::isScriptsEnqueued() ) {
			/**
			 * @var string $type
			 * @var array $scripts
			 */
			foreach ( static::getScripts() as $type => $scripts ) {
				$callback = match ( $type ) {
					'css' => 'wp_enqueue_style',
					default => 'wp_enqueue_script',
				};
				/** @var array $script */
				foreach ( $scripts as $script ) {
					call_user_func_array( $callback, $script );
				}
			}
			static::setScriptsEnqueued( true );
		}
	}

	/**
	 * @return bool
	 */
	protected static function isScriptsEnqueued(): bool {
		return ! empty( static::$scripts_enqueued );
	}

	/**
	 * @param bool $scripts_enqueued
	 */
	protected static function setScriptsEnqueued( bool $scripts_enqueued ): void {
		static::$scripts_enqueued = $scripts_enqueued;
	}

	/**
	 * @return array
	 */
	protected static function getScripts(): array {
		if ( ! is_array( static::$scripts ) ) {
			static::setScripts( array() );
		}

		return static::$scripts;
	}

	/**
	 * @param array $scripts
	 */
	protected static function setScripts( array $scripts ): void {
		static::$scripts = wp_parse_args( $scripts, static::defaultScripts() );
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
	protected static function maybeMinify( $url ): string {
		$min = static::min();

		return empty( $min ) ?
			$url
			: preg_replace( '/(?<!\.min)(\.js|\.css)/', "$min$1", $url );
	}

	/**
	 * Returns .min if script debug is not enabled.
	 *
	 * @return string
	 */
	protected static function min(): string {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
	}

}
