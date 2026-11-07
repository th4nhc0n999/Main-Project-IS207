<?php

namespace App\Contracts\Bkd;

interface PatientSnapshot
{
    /** Adapter for Hiệu's makePatientSnapshot; return masked data only. */
    public function makePatientSnapshot(object $profile): array;
}
