<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Trait HTMLTagTrait
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
trait HTMLTagTrait {

	/**
	 * @var array $html_attributes
	 */
	protected $html_attributes;

	/**
	 * @var string $content
	 */
	protected $content;

	/**
	 * @var string $tag
	 */
	protected $tag;

	/**
	 * @var bool $self_closing
	 */
	protected $self_closing;

	/**
	 * @return string
	 */
	protected function toHTML(): string {
		if ( $this->isSelfClosing() ) {
			$closure = $this->isXHTML() ? '/>' : '>';
		} else {
			$closure = '>' . $this->getContent() . sprintf( '</%1$s>', $this->getTag() );
		}

		return sprintf(
			'<%1$s %2$s%3$s',
			$this->getTag(),
			$this->getHTMLAttributesString(),
			$closure
		);
	}

	/**
	 * @return bool
	 */
	protected function isSelfClosing(): bool {
		if ( !is_bool( $this->self_closing ) ) {
			$this->setSelfClosing(
				in_array( $this->getTag(), array(
					'area',
					'base',
					'br',
					'col',
					'embed',
					'hr',
					'img',
					'input',
					'link',
					'meta',
					'param',
					'source',
					'track',
					'wbr',
				) )
			);
		}

		return $this->self_closing;
	}

	/**
	 * @param bool $self_closing
	 *
	 * @return HTMLTagTrait
	 */
	protected function setSelfClosing( bool $self_closing ): HTMLTagTrait {
		$this->self_closing = $self_closing;

		return $this;
	}

	/**
	 * @return string
	 */
	protected function getTag(): string {
		return $this->tag;
	}

	/**
	 * @param string $tag
	 *
	 * @return HTMLTagTrait
	 */
	protected function setTag( string $tag ): HTMLTagTrait {
		$this->tag = $tag;

		return $this;
	}

	/**
	 * @return bool
	 */
	protected function isXHTML(): bool {
		return !empty( self::XHTML );
	}

	/**
	 * @return string
	 */
	public function getContent(): string {
		if ( !is_string( $this->content ) ) {
			$this->setContent( '' );
		}

		return $this->content;
	}

	/**
	 * @param string $content
	 *
	 * @return HTMLTagTrait
	 */
	public function setContent( string $content ): HTMLTagTrait {
		$this->content = $content;

		return $this;
	}

	/**
	 * @return string
	 */
	protected function getHTMLAttributesString(): string {
		$attributes = $this->getHtmlAttributes();
		array_walk( $attributes, function ( &$value, $key ) {
			$value = sprintf( '%1$s="%2$s"', $key, $value );
		} );

		return join( ' ', $attributes );
	}

	/**
	 * @return array
	 */
	protected function getHtmlAttributes(): array {
		return $this->html_attributes;
	}

	/**
	 * @param array $html_attributes
	 *
	 * @return HTMLTagTrait
	 * @noinspection PhpUnused
	 */
	protected function setHtmlAttributes( array $html_attributes ): HTMLTagTrait {
		$this->html_attributes = $html_attributes;

		return $this;
	}

}
