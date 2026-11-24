<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'owner_type'   => ['required', 'in:doctor,hospital'],
            'owner_id'     => ['required', 'integer'],
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
            'work_date'    => ['required', 'date'],
            'start_time'   => ['required'],
            'end_time'     => ['required'],
            'capacity'     => ['nullable', 'integer', 'min:1'],
            'status'       => ['nullable', 'in:available,full,blocked'],
        ];
    }
}
