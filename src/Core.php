<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class Core
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
class Core {

	use DateFormatTranslateTrait, HTMLTagTrait, IsEmptyTrait, ParseArgsRecursiveTrait, ScriptsTrait;

	protected const DEFAULT_DATE_FORMAT     = 'Y-m-d';
	protected const NAME                    = 'availability-calendar';
	protected const SCRIPTS_HANDLE          = 'availability-calendar';
	protected const DEFAULT_DAYS_IN_ADVANCE = 0;
	protected const DEFAULT_BOOKING_WINDOW  = 365;
	protected const DEFAULT_MIN_STAY        = 1;
	protected const DEFAULT_MAX_STAY        = 180;
	protected const DEFAULT_SHOW_RATES      = false;
	protected const XHTML                   = false;

	/**
	 * @var array|array[] $instances
	 */
	protected static $instances;

	/**
	 * @var string[]
	 */
	protected static $messages;

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
	 * Core constructor.
	 *
	 * @param array|null $availability
	 * @param array|null $parameters
	 */
	public function __construct( ?array $availability = null, ?array $parameters = null ) {
		$this->setTag( 'div' );
		$this->setSelfClosing( false );
		$this->setAvailability( (array) $availability );
		$this->setParameters( (array) $parameters );
		$this->addInstance( array(
			'parameters'   => $this->getCalendarParameters(),
			'availability' => $this->getAvailability(),
		) );
	}

	/**
	 * Adds instances as javascript variable in WP.
	 */
	public static function localizeScripts(): void {
		wp_localize_script(
			self::SCRIPTS_HANDLE,
			'availabilityCalendar',
			array(
				'calendars' => self::getInstances(),
				'messages'  => self::getMessages(),
				'defaults'  => self::getGlobalDefaults(),
			)
		);
	}

	/**
	 * @inheritDoc
	 */
	protected static function defaultScripts(): array {
		return array(
			'css' => array(
				array(
					self::SCRIPTS_HANDLE,
					self::maybeMinify( self::pathToUrl(
						dirname( __FILE__, 2 ) . '/includes/css/availability-calendar.css'
					) ),
					array(),
					null,
					'all',
				),
			),
			'js'  => array(
				array(
					self::SCRIPTS_HANDLE,
					self::maybeMinify( self::pathToUrl(
						dirname( __FILE__, 2 ) . '/includes/js/availability-calendar.js'
					) ),
					array( 'jquery-ui-datepicker' ),
					null,
					true,
				),
			),
		);
	}

	/**
	 * @inheritDoc
	 */
	protected static function setScriptsEnqueued( bool $scripts_enqueued ): void {
		if ( $scripts_enqueued ) {
			$hook = is_admin() ? 'admin_print_footer_scripts' : 'wp_print_footer_scripts';
			add_action( $hook, array( 'SergeLiatko\WPAvailabilityCalendar\Core', 'localizeScripts' ), 0, 0 );
		}
		self::$scripts_enqueued = $scripts_enqueued;
	}


	/**
	 * @return string
	 */
	public function __toString(): string {
		self::maybeEnqueueScripts();

		return $this->toHTML();
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
	 * @return string[]
	 */
	protected static function getMessages(): array {
		if ( !is_array( self::$messages ) ) {
			self::setMessages( self::getDefaultMessages() );
		}

		return self::$messages;
	}

	/**
	 * @param string[] $messages
	 */
	protected static function setMessages( array $messages ): void {
		self::$messages = $messages;
	}

	/**
	 * @return array
	 */
	protected static function getDefaultMessages(): array {
		return apply_filters( 'availability_calendar_default_messages', array(
			'available'                  => 'Available.',
			'unavailable'                => 'Booked.',
			'arrivalsAllowed'            => 'Arrivals are allowed.',
			'arrivalsNotAllowed'         => 'Arrivals are not allowed.',
			'departuresAllowed'          => 'Departures are allowed.',
			'departuresNotAllowed'       => 'Departures are not allowed.',
			'rate'                       => 'Rates from {rate}/night.',
			'minimumStay'                => 'Minimum stay is {minimumStay} night(s).',
			'minimumStayConflict'        => 'Your departure cannot be prior to minimum stay requirement.',
			'selectedArrival'            => 'Your selected arrival date.',
			'selectedStay'               => 'Your selected stay.',
			'selectedDeparture'          => 'Your selected departure date.',
			'selectedDatesConflict'      => 'This date availability conflicts with your selected dates.',
			'selectedArrivalConflict'    => 'Arrival is not possible on this date.',
			'selectedDepartureConflict'  => 'Departure is not possible on this date.',
			'selectedStayConflict'       => 'Stay date conflicts with rules or availability.',
			'minimumStayPeriod'          => 'Minimum stay.',
			'firstAvailableDeparture'    => 'First available departure.',
			'selectAnotherDate'          => 'Please select another date or call us for assistance.',
			'arrivalImpossible'          => 'Sorry, minimum stay requirement does not allow to arrive on this date.',
			'selectArrivalDate'          => 'Please select you arrival date.',
			'modifyArrivalDate'          => 'If necessary, modify your arrival date.',
			'confirmDepartureDate'       => 'Please confirm your departure date.',
			'help'                       => 'Help',
			'alertNoArrivals'            => 'Arrivals are not allowed on this day.',
			'alertNoDepartures'          => 'Departures are not allowed on this day.',
			'legendNoArrivalsDepartures' => 'Date is available, but arrivals/departures are not allowed on this day.',
			'legendConflict'             => 'Selected date is unavailable or conflicts with booking rules (minimum stay/allowed arrivals or departures).',
			'legendHelp'                 => 'Right click (or long press on touch screens) on a date to show details.',
			'unknownError'               => 'An error occurred. Please retry or contact us for assistance.',
		) );
	}

	/**
	 * @return array
	 */
	protected static function getGlobalDefaults(): array {
		return apply_filters( 'availability_calendar_global_defaults', array(
			'dateFormat'        => self::PHPDateFormatToJSDatePicker( self::DEFAULT_DATE_FORMAT ),
			'dateFormatDisplay' => self::PHPDateFormatToJSDatePicker(
				get_option( 'date_format', self::DEFAULT_DATE_FORMAT )
			),
			'maxStay'           => self::DEFAULT_MAX_STAY,
			'minStay'           => self::DEFAULT_MIN_STAY,
			'bookingWindow'     => self::DEFAULT_BOOKING_WINDOW,
			'daysInAdvance'     => self::DEFAULT_DAYS_IN_ADVANCE,
			'showRates'         => self::DEFAULT_SHOW_RATES,
		) );
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
			$this->getDefaultParameters()
		);

		return $this;
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
	 * @param \SergeLiatko\WPAvailabilityCalendar\AvailabilityInterface[] $availability
	 *
	 * @return Core
	 */
	protected function setAvailability( array $availability ): Core {
		$availability = array_filter( $availability, function ( object $date ) {
			return in_array(
				'SergeLiatko\WPAvailabilityCalendar\AvailabilityInterface',
				class_implements( get_class( $date ) )
			);
		} );
		$dates        = array();
		/** @var \SergeLiatko\WPAvailabilityCalendar\AvailabilityInterface $date */
		foreach ( $availability as $date ) {
			$dates[ $date->getDate() ] = $date->__toArray();
		}
		$this->availability = $dates;

		return $this;
	}

	/**
	 * @return array
	 */
	protected function getCalendarParameters(): array {
		return array_diff_key(
			self::parseArgsRecursive( array(
				'firstDate' => $this->getFirstDate(),
				'lastDate'  => $this->getLastDate(),
			), $this->getParameters() ),
			array(
				'html_attrs'    => 'html_attrs',
				'srcDateFormat' => 'srcDateFormat',
			)
		);
	}

	/**
	 * @return array
	 */
	protected function getHtmlAttributes(): array {
		$data = array_intersect_key(
			$this->getParameters(),
			array( 'html_attrs' => 'html_attrs' )
		);

		return array_pop( $data );
	}


	/**
	 * @return array
	 */
	protected function getDefaultParameters(): array {
		$defaults = array(
			'html_attrs'         => array(
				'id'            => $this->getCalendarHtmlId(),
				'class'         => $this->getName(),
				//do not overwrite this attribute, unless you know what you're doing
				'data-instance' => $this->getInstanceNumber(),
			),
			'arrivalId'          => $this->getArrivalHtmlId(),
			'arrivalDisplayId'   => $this->getArrivalDisplayHtmlId(),
			'srcDateFormat'      => self::DEFAULT_DATE_FORMAT,
			'dateFormat'         => self::PHPDateFormatToJSDatePicker( self::DEFAULT_DATE_FORMAT ),
			'dateFormatDisplay'  => self::PHPDateFormatToJSDatePicker(
				get_option( 'date_format', self::DEFAULT_DATE_FORMAT )
			),
			'departureId'        => $this->getDepartureHtmlId(),
			'departureDisplayId' => $this->getDepartureDisplayHtmlId(),
			'maxStay'            => self::DEFAULT_MAX_STAY,
			'minStay'            => self::DEFAULT_MIN_STAY,
			'daysInAdvance'      => self::DEFAULT_DAYS_IN_ADVANCE,
			'bookingWindow'      => self::DEFAULT_BOOKING_WINDOW,
			'showRates'          => false,
			'weekStart'          => absint( get_option( 'start_of_week', 0 ) ),
		);

		/**
		 * Allows overwriting the default parameters used in availability calendar constructor.
		 *
		 * @filter availability_calendar_default_params
		 *
		 * @param array                                    $defaults
		 * @param \SergeLiatko\WPAvailabilityCalendar\Core $this
		 */
		return apply_filters(
			'availability_calendar_default_params',
			$defaults,
			$this
		);
	}

	/**
	 * @return string
	 */
	protected function getFirstDate(): string {
		$user_parameters = $this->getParameters();
		if (
			self::isEmpty( $dates = $this->getAvailability() )
			|| self::isEmpty( $first = array_shift( $dates ) )
			|| empty( $first['date'] )
		) {
			if ( empty( $user_parameters['daysInAdvance'] ) ) {
				return date( $user_parameters['srcDateFormat'], strtotime( 'today' ) );
			}

			return date(
				$user_parameters['srcDateFormat'],
				strtotime(
					sprintf( '+%1$d day', $user_parameters['daysInAdvance'] ),
					strtotime( 'today' )
				)
			);
		}

		return empty( $user_parameters['daysInAdvance'] ) ?
			$first['date']
			: date(
				$user_parameters['srcDateFormat'],
				strtotime(
					sprintf( '+%1$d day', $user_parameters['daysInAdvance'] ),
					date_create_from_format(
						$user_parameters['srcDateFormat'],
						$first['date']
					)->format( 'U' )
				)
			);
	}

	/**
	 * @param string $format
	 *
	 * @return string
	 */
	protected function getLastDate( string $format = self::DEFAULT_DATE_FORMAT ): string {
		$user_parameters = $this->getParameters();
		if (
			self::isEmpty( $dates = $this->getAvailability() )
			|| self::isEmpty( $last = array_pop( $dates ) )
			|| empty( $last['date'] )
		) {
			if ( empty( $user_parameters['bookingWindow'] ) ) {
				//return empty string as 0 is no limit
				return '';
			}

			return date(
				$format,
				strtotime( sprintf( '+%1$d day', $user_parameters['bookingWindow'] ) )
			);
		}

		$max_stay = empty( $last['maxStay'] ) ? $user_parameters['maxStay'] : $last['maxStay'];

		return date(
			$user_parameters['srcDateFormat'],
			strtotime(
				sprintf( '+%1$d day', $max_stay ),
				date_create_from_format(
					$user_parameters['srcDateFormat'],
					$last['date']
				)->format( 'U' )
			)
		);
	}

	/**
	 * @param array $items
	 *
	 * @return string
	 */
	protected function toHtmlId( array $items = array() ): string {
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
