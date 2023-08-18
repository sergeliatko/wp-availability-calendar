<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class Core
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
class Core {

	use DateFormatTranslateTrait, HTMLTagTrait, IsEmptyTrait, ParseArgsRecursiveTrait, ScriptsTrait;

	protected const DEFAULT_DATE_FORMAT            = 'Y-m-d';
	protected const NAME                           = 'availability-calendar';
	protected const SCRIPTS_HANDLE                 = 'availability-calendar';
	protected const DEFAULT_DAYS_IN_ADVANCE        = 0;
	protected const DEFAULT_BOOKING_WINDOW         = 365;
	protected const DEFAULT_MIN_STAY               = 1;
	protected const DEFAULT_MAX_STAY               = 180;
	protected const DEFAULT_SHOW_RATES             = false;
	protected const DEFAULT_HIDE_UNAVAILABLE_RATES = false;
	protected const XHTML                          = false;

	/**
	 * @var array|array[] $instances
	 */
	protected static $instances;

	/**
	 * @var string[]
	 */
	protected static $messages;

	/**
	 * @var string $help_html
	 */
	protected static $help_html;

	/**
	 * @var string $clear_html
	 */
	protected static $clear_html;

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
			static::SCRIPTS_HANDLE,
			'availabilityCalendar',
			array(
				'calendars' => static::getInstances(),
				'messages'  => static::getMessages(),
				'defaults'  => static::getGlobalDefaults(),
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
					static::SCRIPTS_HANDLE,
					static::maybeMinify( static::pathToUrl(
						dirname( __FILE__, 2 ) . '/includes/css/availability-calendar.css'
					) ),
					array( 'dashicons' ),
					null,
					'all',
				),
			),
			'js'  => array(
				array(
					static::SCRIPTS_HANDLE,
					static::maybeMinify( static::pathToUrl(
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
		static::$scripts_enqueued = $scripts_enqueued;
	}


	/**
	 * @return string
	 */
	public function __toString(): string {
		static::maybeEnqueueScripts();

		return HTMLContainer::HTML(
			$this->getContainerHtmlAttributes(),
			HTMLContainer::HTML( array( 'class' => 'availability-calendar-messages' ) ) .
			$this->toHTML() .
			static::getClearHtml() .
			static::getHelpHtml()
		);
	}

	/**
	 * @return string
	 */
	protected static function getHelpHtml(): string {
		if ( empty( static::$help_html ) ) {
			$items = array(
				'available'   => static::getMessage( 'available' ),
				'not-allowed' => static::getMessage( 'legendNoArrivalsDepartures' ),
				'unavailable' => static::getMessage( 'unavailable' ),
				'preselected' => static::getMessage( 'minimumStayPeriod' ),
				'selected'    => static::getMessage( 'selectedStay' ),
				'conflict'    => static::getMessage( 'legendConflict' ),
				'reset'       => static::getMessage( 'legendReset' ),
				'help'        => static::getMessage( 'legendHelp' ),
				'prompt'      => static::getMessage( 'legendPrompt' ),
			);
			array_walk( $items, function ( &$content, $class ) {
				switch ( $class ) {
					case 'reset':
						$content_prefix = HTMLContainer::HTML(
							array( 'class' => 'dashicons dashicons-saved' ),
							'',
							'span'
						);
						break;
					case 'help':
						$content_prefix = HTMLContainer::HTML(
							array( 'class' => 'dashicons dashicons-info-outline' ),
							'',
							'span'
						);
						break;
					case 'prompt':
						$content_prefix = HTMLContainer::HTML(
							array( 'class' => 'dashicons dashicons-phone' ),
							'',
							'span'
						);
						break;
					case 'available':
					case 'not-allowed':
					case 'unavailable':
					case 'preselected':
					case 'selected':
					case 'conflict':
					default:
						$content_prefix = HTMLContainer::HTML(
							array(
								'class' => 'legend-icon legend-icon-' . $class,
							),
							rand( 1, 31 ),
							'span'
						);
						break;
				}
				$content = HTMLContainer::HTML(
					array(
						'class' => 'legend-item legend-item-' . $class,
					),
					join( ' ', array_filter( array( $content_prefix, $content ) ) ),
					'p'
				);
			} );
			$html = HTMLContainer::HTML(
				array(
					'class' => 'availability-calendar-help',
				),
				HTMLContainer::HTML(
					array(
						'class' => 'help-button-wrapper',
					),
					HTMLContainer::HTML(
						array(
							'class' => 'help-button',
						),
						'<span class="dashicons dashicons-info-outline"></span>' . static::getMessage( 'help' ),
						'span'
					),
					'p'
				) .
				HTMLContainer::HTML(
					array(
						'class' => 'help-inner',
					),
					join( '', $items )
				)
			);
			static::setHelpHtml( $html );
		}

		return static::$help_html;
	}

	/**
	 * @param string $help_html
	 */
	protected static function setHelpHtml( string $help_html ) {
		static::$help_html = $help_html;
	}

	/**
	 * @return string
	 */
	protected static function getClearHtml(): string {
		if ( static::isEmpty( static::$clear_html ) ) {
			$clear_html = HTMLContainer::HTML(
				array(
					'class' => 'availability-calendar-clear',
				),
				HTMLContainer::HTML(
					array(
						'class' => 'clear-button',
					),
					'<span class="dashicons dashicons-no-alt"></span>' . static::getMessage( 'clear' ),
					'span'
				),
				'p'
			);
			static::setClearHtml( $clear_html );
		}

		return static::$clear_html;
	}

	/**
	 * @param string $clear_html
	 */
	protected static function setClearHtml( string $clear_html ): void {
		static::$clear_html = $clear_html;
	}

	/**
	 * @param array $instance
	 *
	 * @return $this
	 */
	protected function addInstance( array $instance ): Core {
		$instances                               = static::getInstances();
		$instances[ $this->getInstanceNumber() ] = $instance;
		static::setInstances( $instances );

		return $this;
	}

	/**
	 * @return array|array[]
	 */
	protected static function getInstances(): array {
		if ( !is_array( static::$instances ) ) {
			static::setInstances( array() );
		}

		return static::$instances;
	}

	/**
	 * @param array|array[] $instances
	 */
	protected static function setInstances( array $instances ): void {
		static::$instances = $instances;
	}

	/**
	 * @return string[]
	 */
	protected static function getMessages(): array {
		if ( !is_array( static::$messages ) ) {
			static::setMessages( static::getDefaultMessages() );
		}

		return static::$messages;
	}

	/**
	 * @param string[] $messages
	 */
	protected static function setMessages( array $messages ): void {
		static::$messages = $messages;
	}

	/**
	 * @param string $message
	 *
	 * @return string
	 */
	protected static function getMessage( string $message ): string {
		$messages = static::getMessages();

		return empty( $messages[ $message ] ) ? '' : $messages[ $message ];
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
			'oldRate'                    => 'Previously from {oldRate}/night.',
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
			'modifyArrivalDate'          => 'If needed, modify your arrival date.',
			'confirmDepartureDate'       => 'Please confirm your departure date.',
			'clear'                      => 'Clear dates',
			'help'                       => 'Help',
			'alertNoArrivals'            => 'Sorry, arrivals are not allowed on this day.',
			'alertNoDepartures'          => 'Sorry, departures are not allowed on this day.',
			'legendNoArrivalsDepartures' => 'Date is available, but arrivals/departures are not allowed on this day.',
			'legendConflict'             => 'Selected date is unavailable or conflicts with booking rules (minimum stay/allowed arrivals or departures).',
			'legendReset'                => 'To modify the arrival date, make sure you have confirmed the departure date.',
			'legendHelp'                 => 'Right click (or long press on touch screens) on a date to show details.',
			'legendPrompt'               => 'Feel free to contact us if you need assistance with availability or booking rules.',
			'unknownError'               => 'An error occurred. Please retry or contact us for assistance.',
		) );
	}

	/**
	 * @return array
	 */
	protected static function getGlobalDefaults(): array {
		return apply_filters( 'availability_calendar_global_defaults', array(
			'dateFormat'           => static::PHPDateFormatToJSDatePicker( static::DEFAULT_DATE_FORMAT ),
			'dateFormatDisplay'    => static::PHPDateFormatToJSDatePicker(
				get_option( 'date_format', static::DEFAULT_DATE_FORMAT )
			),
			'maxStay'              => static::DEFAULT_MAX_STAY,
			'minStay'              => static::DEFAULT_MIN_STAY,
			'bookingWindow'        => static::DEFAULT_BOOKING_WINDOW,
			'daysInAdvance'        => static::DEFAULT_DAYS_IN_ADVANCE,
			'showRates'            => static::DEFAULT_SHOW_RATES,
			'hideUnavailableRates' => static::DEFAULT_HIDE_UNAVAILABLE_RATES,
		) );
	}

	/**
	 * @return int
	 */
	protected function getInstanceNumber(): int {
		if ( !is_int( $this->instance_number ) ) {
			$this->setInstanceNumber( count( static::getInstances() ) );
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
		$this->parameters = static::parseArgsRecursive(
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
			static::parseArgsRecursive( array(
				'firstDate' => $this->getFirstDate(),
				'lastDate'  => $this->getLastDate(),
			), $this->getParameters() ),
			array(
				'html_attrs'           => 'html_attrs',
				'container_html_attrs' => 'container_html_attrs',
				'srcDateFormat'        => 'srcDateFormat',
			)
		);
	}

	/**
	 * @return array
	 */
	protected function getHtmlAttributes(): array {
		return is_array( $html_attrs = $this->getCalendarParameter( 'html_attrs' ) ) ?
			$html_attrs
			: array();
	}

	/**
	 * @return array
	 */
	protected function getContainerHtmlAttributes(): array {
		return is_array( $html_attrs = $this->getCalendarParameter( 'container_html_attrs' ) ) ?
			$html_attrs
			: array();
	}

	/**
	 * @param string $parameter
	 *
	 * @return mixed|null
	 */
	protected function getCalendarParameter( string $parameter ) {
		$parameters = $this->getParameters();

		return $parameters[ $parameter ] ?? null;
	}


	/**
	 * @return array
	 */
	protected function getDefaultParameters(): array {
		$defaults = array(
			'html_attrs'           => array(
				'id'            => $this->getCalendarHtmlId(),
				'class'         => $this->getName(),
				//do not overwrite this attribute, unless you know what you're doing
				'data-instance' => $this->getInstanceNumber(),
			),
			'container_html_attrs' => array(
				'id'    => $this->getCalendarHtmlId() . '-wrapper',
				'class' => $this->getName() . '-wrapper',
			),
			'arrivalId'            => $this->getArrivalHtmlId(),
			'arrivalDisplayId'     => $this->getArrivalDisplayHtmlId(),
			'srcDateFormat'        => static::DEFAULT_DATE_FORMAT,
			'dateFormat'           => static::PHPDateFormatToJSDatePicker( static::DEFAULT_DATE_FORMAT ),
			'dateFormatDisplay'    => static::PHPDateFormatToJSDatePicker(
				get_option( 'date_format', static::DEFAULT_DATE_FORMAT )
			),
			'departureId'          => $this->getDepartureHtmlId(),
			'departureDisplayId'   => $this->getDepartureDisplayHtmlId(),
			'maxStay'              => static::DEFAULT_MAX_STAY,
			'minStay'              => static::DEFAULT_MIN_STAY,
			'daysInAdvance'        => static::DEFAULT_DAYS_IN_ADVANCE,
			'bookingWindow'        => static::DEFAULT_BOOKING_WINDOW,
			'showRates'            => static::DEFAULT_SHOW_RATES,
			'hideUnavailableRates' => static::DEFAULT_HIDE_UNAVAILABLE_RATES,
			'weekStart'            => absint( get_option( 'start_of_week', 0 ) ),
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
	 * @return array First date data from availability array.
	 */
	protected function getAvailabilityFirstDate(): array {
		$availability = $this->getAvailability();
		if ( empty( $availability ) ) {
			return array();
		}
		$firstDateKey = array_keys( $availability )[0];

		return $availability[ $firstDateKey ];
	}

	/**
	 * @return array Last date data from availability array.
	 */
	protected function getAvailabilityLastDate(): array {
		$availability = $this->getAvailability();
		if ( empty( $availability ) ) {
			return array();
		}
		$lastDateKey = array_keys( $availability )[ count( $availability ) - 1 ];

		return $availability[ $lastDateKey ];
	}

	/**
	 * @return string
	 */
	protected function getFirstDate(): string {
		$user_parameters = $this->getParameters();

		$today      = current_time( $user_parameters['srcDateFormat'] );
		$first      = $this->getAvailabilityFirstDate();
		$first_date = empty( $first['date'] ) ? $today : $first['date'];

		if ( 0 === ( $daysInAdvance = absint( $user_parameters['daysInAdvance'] ) ) ) {
			return $first_date;
		}

		return date(
			$user_parameters['srcDateFormat'],
			max(
				strtotime(
					sprintf( '+%d days', $daysInAdvance ),
					date_create_from_format(
						$user_parameters['srcDateFormat'],
						$today
					)->getTimestamp()
				),
				date_create_from_format(
					$user_parameters['srcDateFormat'],
					$first_date
				)->getTimestamp()
			)
		);

	}

	/**
	 * @return string
	 */
	protected function getLastDate(): string {
		$user_parameters = $this->getParameters();
		$last            = $this->getAvailabilityLastDate();

		if ( empty( $last['date'] ) ) {
			return ( 0 === ( $bookingWindow = absint( $user_parameters['bookingWindow'] ) ) ) ?
				''
				: date(
					$user_parameters['srcDateFormat'],
					strtotime( sprintf( '+%1$d day', $bookingWindow ) )
				);
		}

		$max_stay = absint( empty( $last['maxStay'] ) ? $user_parameters['maxStay'] : $last['maxStay'] );

		return date(
			$user_parameters['srcDateFormat'],
			strtotime(
				sprintf( '+%1$d days', $max_stay ),
				date_create_from_format(
					$user_parameters['srcDateFormat'],
					$last['date']
				)->getTimestamp()
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
		return static::NAME;
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
