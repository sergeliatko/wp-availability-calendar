<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class Core
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
class Core {
	use DateFormatTranslateTrait, IsEmptyTrait, ParseArgsRecursiveTrait;

	protected const NAME                    = 'availability-calendar';
	protected const DEFAULT_DATE_FORMAT     = 'Y-m-d';
	protected const DEFAULT_DAYS_IN_ADVANCE = 0;
	protected const DEFAULT_BOOKING_WINDOW  = 365;
	protected const DEFAULT_MIN_STAY        = 1;
	protected const DEFAULT_MAX_STAY        = 180;

	/**
	 * @var array|array[] $instances
	 */
	protected static $instances;

	/**
	 * @var int $instance_number
	 */
	protected $instance_number;

	/**
	 * @var array|array[] $availability
	 */
	protected $availability;

	/**
	 * @var array $parameters
	 */
	protected $parameters;

	/**
	 * @var array $calendar_parameters
	 */
	protected $calendar_parameters;

	/**
	 * Core constructor.
	 *
	 * @param array|null $availability
	 * @param array|null $parameters
	 */
	public function __construct( ?array $availability = null, ?array $parameters = null ) {
		$this->setAvailability( (array) $availability );
		$this->setParameters( (array) $parameters );
		$this->addInstance( array(
			'parameters'   => $this->getCalendarParameters(),
			'availability' => $this->getAvailability(),
		) );
	}

	/**
	 * @param array $instance
	 *
	 * @return $this
	 */
	protected function addInstance( array $instance ): Core {
		$instances                               = self::getInstances();
		$instances[ $this->getInstanceNumber() ] = $instance;
		self::setInstances( $instances );

		return $this;
	}

	/**
	 * @return array|array[]
	 */
	protected static function getInstances(): array {
		if ( !is_array( self::$instances ) ) {
			self::setInstances( array() );
		}

		return self::$instances;
	}

	/**
	 * @param array|array[] $instances
	 */
	protected static function setInstances( array $instances ): void {
		self::$instances = $instances;
	}

	/**
	 * @return int
	 */
	protected function getInstanceNumber(): int {
		if ( !is_int( $this->instance_number ) ) {
			$this->setInstanceNumber( count( self::getInstances() ) );
		}

		return $this->instance_number;
	}

	/**
	 * @param int $instance_number
	 *
	 * @return Core
	 */
	protected function setInstanceNumber( int $instance_number ): Core {
		$this->instance_number = $instance_number;

		return $this;
	}

	/**
	 * @return array
	 */
	public function getCalendarParameters(): array {
		if ( !is_array( $this->calendar_parameters ) ) {
			$this->setCalendarParameters(
				array_intersect_key(
					$this->getParameters(),
					$this->getAllowedCalendarParameters()
				)
			);
		}

		return $this->calendar_parameters;
	}

	/**
	 * @param array $calendar_parameters
	 *
	 * @return Core
	 */
	public function setCalendarParameters( array $calendar_parameters ): Core {
		$this->calendar_parameters = $calendar_parameters;

		return $this;
	}

	/**
	 * @return array
	 */
	protected function getParameters(): array {
		if ( !is_array( $this->parameters ) ) {
			$this->setParameters( array() );
		}

		return $this->parameters;
	}

	/**
	 * @param array $parameters
	 *
	 * @return Core
	 */
	protected function setParameters( array $parameters ): Core {
		$this->parameters = self::parseArgsRecursive(
			$parameters,
			//add instance number without the ability to overwrite it via the default parameters filter
			array_merge(
				$this->getDefaultParameters( $parameters ),
				array(
					'instance' => $this->getInstanceNumber(),
				)
			)
		);

		return $this;
	}

	/**
	 * @return array
	 */
	protected function getAllowedCalendarParameters(): array {
		$keys = array(
			'instance',
			'arrival-id',
			'arrival-display-id',
			'departure-id',
			'departure-display-id',
			'date-format',
			'display-date-format',
			'first-date',
			'last-date',
			'min-stay',
			'max-stay',
		);

		return array_combine( $keys, $keys );
	}

	/**
	 * @return array|array[]
	 */
	protected function getAvailability(): array {
		if ( !is_array( $this->availability ) ) {
			$this->setAvailability( array() );
		}

		return $this->availability;
	}

	/**
	 * @param array|array[] $availability
	 *
	 * @return Core
	 */
	protected function setAvailability( array $availability ): Core {
		$this->availability = $availability;

		return $this;
	}

	/**
	 * @param array $parameters
	 *
	 * @return array
	 */
	protected function getDefaultParameters( array $parameters = array() ): array {
		$user_date_format = empty( $parameters['date-format'] ) ?
			self::DEFAULT_DATE_FORMAT
			: $parameters['date-format'];
		$defaults         = array(
			'html-attrs'           => array(
				'id'    => $this->getCalendarHtmlId(),
				'class' => $this->getName(),
			),
			'arrival-id'           => $this->getArrivalHtmlId(),
			'arrival-display-id'   => $this->getArrivalDisplayHtmlId(),
			'departure-id'         => $this->getDepartureHtmlId(),
			'departure-display-id' => $this->getDepartureDisplayHtmlId(),
			'date-format'          => self::PHPDateFormatToJSDatePicker( $user_date_format ),
			'display-date-format'  => self::PHPDateFormatToJSDatePicker( get_option( 'date_format', self::DEFAULT_DATE_FORMAT ) ),
			'first-date'           => $this->getFirstDate( $user_date_format ),
			'last-date'            => $this->getLastDate( $user_date_format ),
			'min-stay'             => self::DEFAULT_MIN_STAY,
			'max-stay'             => self::DEFAULT_MAX_STAY,
		);

		/**
		 * Allows overwriting the default parameters used in availability calendar constructor.
		 *
		 * @filter availability_calendar_default_params
		 *
		 * @param array                                    $defaults
		 * @param array                                    $parameters
		 * @param \SergeLiatko\WPAvailabilityCalendar\Core $this
		 */
		return apply_filters( 'availability_calendar_default_params', $defaults, $parameters, $this );
	}

	/**
	 * @param string $format
	 *
	 * @return string
	 */
	protected function getFirstDate( string $format = self::DEFAULT_DATE_FORMAT ): string {
		if (
			self::isEmpty( $dates = $this->getAvailability() )
			|| empty( $dates[0]['date'] )
		) {
			return date(
				$format,
				strtotime( sprintf( '+%1$d day', self::DEFAULT_DAYS_IN_ADVANCE ) )
			);
		}

		return empty( $dates[0]['date'] );
	}

	/**
	 * @param string $format
	 *
	 * @return string
	 */
	protected function getLastDate( string $format = self::DEFAULT_DATE_FORMAT ): string {
		if (
			self::isEmpty( $dates = $this->getAvailability() )
			|| self::isEmpty( $count = count( $dates ) )
			|| empty( $dates[ ( $count - 1 ) ]['date'] )
		) {
			return date(
				$format,
				strtotime( sprintf( '+%1$d day', self::DEFAULT_BOOKING_WINDOW ) )
			);
		}

		return empty( $dates[ ( $count - 1 ) ]['date'] );
	}

	/**
	 * @param array $items
	 *
	 * @return string
	 */
	protected function toHtmlId( array $items = array() ) {
		$base = sprintf( '%1$s-%2$d', $this->getName(), $this->getInstanceNumber() );

		return empty( $items ) ? $base : join( '-', array_merge( array( $base ), $items ) );
	}

	/**
	 * @return string
	 */
	protected function getName(): string {
		return self::NAME;
	}

	/**
	 * @return string
	 */
	protected function getArrivalDisplayHtmlId(): string {
		return $this->toHtmlId( array( 'arrival', 'display' ) );
	}

	/**
	 * @return string
	 */
	protected function getArrivalHtmlId(): string {
		return $this->toHtmlId( array( 'arrival' ) );
	}

	/**
	 * @return string
	 */
	protected function getDepartureHtmlId(): string {
		return $this->toHtmlId( array( 'departure' ) );
	}

	/**
	 * @return string
	 */
	protected function getDepartureDisplayHtmlId(): string {
		return $this->toHtmlId( array( 'departure', 'display' ) );
	}

	/**
	 * @return string
	 */
	protected function getCalendarHtmlId(): string {
		return $this->toHtmlId();
	}

}
