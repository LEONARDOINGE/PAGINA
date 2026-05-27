<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'group', 'type'];
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    public static function get(string $key, $default = null)
    {
        $setting = self::find($key);
        return $setting ? ($setting->type === 'boolean' ? $setting->value === '1' : $setting->value) : $default;
    }

    public static function set(string $key, $value, string $group = 'general', string $type = 'string'): void
    {
        self::updateOrCreate(['key' => $key], ['value' => $value, 'group' => $group, 'type' => $type]);
    }
}
