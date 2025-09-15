{{-- resources/views/services/create.blade.php --}}
@extends('layout.admin')

@section('container')
<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="mb-4">Create New Service</h2>
        </div>
        <div class="card-body">
            <form method="POST" action="#">
                @csrf
                
                <div class="row g-3">
                    <!-- Service Name Field -->
                    <div class="col-md-6">
                        <label for="name" class="form-label">Service Name</label>
                        <input type="text" class="form-control @error('name') is-invalid @enderror" 
                               id="name" name="name" value="{{ old('name') }}" required>
                        @error('name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Is Tanière Field -->
                    <div class="col-md-6">
                        <div class="form-check form-switch mt-4">
                            <input class="form-check-input" type="checkbox" id="is_taniere" name="is_taniere" 
                                   value="1" {{ old('is_taniere') ? 'checked' : '' }}>
                            <label class="form-check-label" for="is_taniere">Is this a Tanière?</label>
                        </div>
                        @error('is_taniere')
                            <div class="invalid-feedback d-block">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Region Selection -->
                    <div class="col-md-6">
                        <label for="region_id" class="form-label">Region</label>
                        <select class="form-select @error('region_id') is-invalid @enderror" 
                                id="region_id" name="region_id" required>
                            <option value="">Select Region</option>
                            @foreach($regions as $region)
                                <option value="{{ $region->id }}" {{ old('region_id') == $region->id ? 'selected' : '' }}>
                                    {{ $region->nom }}
                                </option>
                            @endforeach
                        </select>
                        @error('region_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Submit & Cancel Buttons -->
                    <div class="col-12 mt-4 d-flex justify-content-between">
                        <a href="#" class="btn btn-secondary">Cancel</a>
                        <button class="btn btn-primary">Create Service</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection