<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SpecialtyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('specialty') ?? $this->route('id');

        return [
            'code' => ['required', 'string', 'max:10', 'unique:specialties,code,' . $id],
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120', 'unique:specialties,slug,' . $id],
            'description' => ['nullable', 'string'],
            'default_instructions' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:255'],
        ];
    }
}

