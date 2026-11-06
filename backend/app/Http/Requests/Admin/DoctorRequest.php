<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('doctor') ?? $this->route('id');

        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id', 'unique:doctors,user_id,' . $id],
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
            'hospital_id' => ['nullable', 'integer', 'exists:hospitals,id'],
            'name' => ['required', 'string', 'max:150'],
            'title' => ['nullable', 'string', 'max:50'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:70'],
            'bio' => ['nullable', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'consultation_fee' => ['required', 'numeric', 'min:0'],
            'avatar' => ['nullable', 'string', 'max:255'],
        ];
    }
}
