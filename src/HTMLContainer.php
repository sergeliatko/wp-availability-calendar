<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class HTMLContainer
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
class HTMLContainer {

	use HTMLTagTrait;

	/**
	 * HTMLContainer constructor.
	 *
	 * @param array  $html_attributes
	 * @param string $content
	 * @param string $tag
	 * @param bool   $self_closing
	 */
	public function __construct( array $html_attributes, string $content = '', string $tag = 'div', bool $self_closing = false ) {
		$this->setHtmlAttributes( $html_attributes );
		$this->setContent( $content );
		$this->setTag( $tag );
		$this->setSelfClosing( $self_closing );
	}

	/**
	 * @param array  $html_attributes
	 * @param string $content
	 * @param string $tag
	 * @param bool   $self_closing
	 *
	 * @return string
	 */
	public static function HTML( array $html_attributes, string $content = '', string $tag = 'div', bool $self_closing = false ): string {
		$instance = new self( $html_attributes, $content, $tag, $self_closing );

		return $instance->toHTML();
	}

	/**
	 * @return string
	 */
	public function __toString(): string {
		return $this->toHTML();
	}

}
