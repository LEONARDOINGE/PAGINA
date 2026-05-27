<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'reviewer_id', 'period', 'rating_overall',
        'rating_performance', 'rating_teamwork', 'rating_leadership',
        'goals_achieved', 'goals_next', 'strengths', 'areas_improvement',
        'comments', 'status',
    ];
    protected $casts = ['rating_overall' => 'decimal:1', 'rating_performance' => 'decimal:1', 'rating_teamwork' => 'decimal:1', 'rating_leadership' => 'decimal:1'];

    const STATUSES = ['borrador', 'compartido', 'revisado', 'cerrado'];

    public function employee(): BelongsTo { return $this->belongsTo(Employee::class); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewer_id'); }
}
