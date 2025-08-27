<?php


namespace SergeLiatko\WPAvailabilityCalendar;

/**
 * Class Availability
 *
 * @package SergeLiatko\WPAvailabilityCalendar
 */
class Availability implements AvailabilityInterface {

	/**
	 * @var string $date
	 */
	public string $date;

	/**
	 * @var bool $available
	 */
	public bool $available;

	/**
	 * @var bool $arrival
	 */
	public bool $arrival;

	/**
	 * @var bool $departure
	 */
	public bool $departure;

	/**
	 * @var int $minStay
	 */
	public int $minStay;

	/**
	 * @var int $maxStay
	 */
	public int $maxStay;

	/**
	 * @var string $rate
	 */
	public string $rate;

	/**
	 * @var string $oldRate
	 */
	public string $oldRate;

	/**
	 * Availability constructor.
	 *
	 * @param string $date
	 * @param bool   $available
	 * @param bool   $arrival
	 * @param bool   $departure
	 * @param int    $minStay
	 * @param int    $maxStay
	 * @param string $rate
	 * @param string $oldRate
	 */
	public function __construct(
		string $date,
		bool   $available,
		bool   $arrival,
		bool   $departure,
		int    $minStay,
		int    $maxStay,
		string $rate,
		string $oldRate = ''
	) {
		$this->setDate( $date );
		$this->setAvailable( $available );
		$this->setArrival( $arrival );
		$this->setDeparture( $departure );
		$this->setMinStay( $minStay );
		$this->setMaxStay( $maxStay );
		$this->setRate( $rate );
		$this->setOldRate( $oldRate );
	}

	/**
	 * @return string
	 */
	public function getDate(): string {
		return $this->date;
	}

	/**
	 * @param string $date
	 *
	 * @return Availability
	 */
	public function setDate( string $date ): Availability {
		$this->date = $date;

		return $this;
	}

	/**
	 * @return bool
	 * @noinspection PhpUnused
	 */
	public function getAvailable(): bool {
		return $this->available;
	}

	/**
	 * @param bool $available
	 *
	 * @return Availability
	 */
	public function setAvailable( bool $available ): Availability {
		$this->available = $available;

		return $this;
	}

	/**
	 * @return bool
	 * @noinspection PhpUnused
	 */
	public function getArrival(): bool {
		return $this->arrival;
	}

	/**
	 * @param bool $arrival
	 *
	 * @return Availability
	 */
	public function setArrival( bool $arrival ): Availability {
		$this->arrival = $arrival;

		return $this;
	}

	/**
	 * @return bool
	 * @noinspection PhpUnused
	 */
	public function getDeparture(): bool {
		return $this->departure;
	}

	/**
	 * @param bool $departure
	 *
	 * @return Availability
	 */
	public function setDeparture( bool $departure ): Availability {
		$this->departure = $departure;

		return $this;
	}

	/**
	 * @return int
	 * @noinspection PhpUnused
	 */
	public function getMinStay(): int {
		return $this->minStay;
	}

	/**
	 * @param int $minStay
	 *
	 * @return Availability
	 */
	public function setMinStay( int $minStay ): Availability {
		$this->minStay = $minStay;

		return $this;
	}

	/**
	 * @return int
	 * @noinspection PhpUnused
	 */
	public function getMaxStay(): int {
		return $this->maxStay;
	}

	/**
	 * @param int $maxStay
	 *
	 * @return Availability
	 */
	public function setMaxStay( int $maxStay ): Availability {
		$this->maxStay = $maxStay;

		return $this;
	}

	/**
	 * @return string
	 * @noinspection PhpUnused
	 */
	public function getRate(): string {
		return $this->rate;
	}

	/**
	 * @param string $rate
	 *
	 * @return Availability
	 */
	public function setRate( string $rate ): Availability {
		$this->rate = $rate;

		return $this;
	}

	/**
	 * @return string
	 */
	public function getOldRate(): string {
		return $this->oldRate;
	}

	/**
	 * @param string $oldRate
	 *
	 * @return Availability
	 */
	public function setOldRate( string $oldRate ): Availability {
		$this->oldRate = $oldRate;

		return $this;
	}

	/**
	 * @inheritDoc
	 */
	public function __toArray(): array {
		return get_object_vars( $this );
	}

}
