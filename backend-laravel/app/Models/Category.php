<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'icon', 'parent_id', 'active'];
    protected $casts = ['active' => 'boolean'];

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children(): HasMany { return $this->hasMany(Category::class, 'parent_id'); }
    public function products(): HasMany { return $this->hasMany(Product::class); }

    public function scopeActive($q) { return $q->where('active', true); }
}
