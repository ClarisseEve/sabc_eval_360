{{-- resources/views/admin/users/create.blade.php --}}
@extends('layout.admin')

@section('container')
<div class="container">
    <div class="card">
        
        <div class="card-body">
            <form method="POST" action="{{ route('admin.users.store') }}">
                @csrf
                
                <div class="row g-3">
                    <!-- Matricule Field -->
                    <div class="col-md-6">
                        <label for="matricule" class="form-label">Matricule</label>
                        <input type="text" class="form-control @error('matricule') is-invalid @enderror" 
                               id="matricule" name="matricule" value="{{ old('matricule') }}" required>
                        @error('matricule')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Name Field -->
                    <div class="col-md-6">
                        <label for="name" class="form-label">Name</label>
                        <input type="text" class="form-control @error('name') is-invalid @enderror" 
                               id="name" name="name" value="{{ old('name') }}" required>
                        @error('name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Surname Field -->
                    <div class="col-md-6">
                        <label for="surname" class="form-label">Surname</label>
                        <input type="text" class="form-control @error('surname') is-invalid @enderror" 
                               id="surname" name="surname" value="{{ old('surname') }}" required>
                        @error('surname')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Login Field -->
                    <div class="col-md-6">
                        <label for="login" class="form-label">Login</label>
                        <input type="text" class="form-control @error('login') is-invalid @enderror" 
                               id="login" name="login" value="{{ old('login') }}" required>
                        @error('login')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Email Field -->
                    <div class="col-md-6">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control @error('email') is-invalid @enderror" 
                               id="email" name="email" value="{{ old('email') }}">
                        @error('email')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- User Type -->
                    <div class="col-md-6">
                        <label for="type" class="form-label">User Type</label>
                        <select class="form-select @error('type') is-invalid @enderror" 
                                id="type" name="type" required>
                            <option value="">Select Type</option>
                            <option value="CDV" {{ old('type') == 'CDV' ? 'selected' : '' }}>CDV</option>
                            <option value="CDS" {{ old('type') == 'CDS' ? 'selected' : '' }}>CDS</option>
                            <option value="CSC" {{ old('type') == 'CSC' ? 'selected' : '' }}>CSC</option>
                            <option value="DR" {{ old('type') == 'DR' ? 'selected' : '' }}>DR</option>
                            <option value="CDC TT" {{ old('type') == 'CDC TT' ? 'selected' : '' }}>CDC TT</option>
                        </select>
                        @error('type')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Region Selection -->
                    <div class="col-md-6">
                        <label for="region_id" class="form-label">Region</label>
                        <select class="form-select @error('region_id') is-invalid @enderror" 
                                id="region_id" name="region_id">
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
        
                    <!-- Services (dynamic based on region) -->
                    <div class="col-md-6">
                        <label for="service_id" class="form-label">Service</label>
                        <select class="form-select @error('service_id') is-invalid @enderror" 
                                id="service_id" name="service_id" disabled>
                            <option value="">Select a region first</option>
                        </select>
                        @error('service_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
        
                    <!-- Parent User Selection (dynamic based on service) -->
                    <div class="col-md-6">
                        <label for="parent_id" class="form-label">Manager</label>
                        <select class="form-select @error('parent_id') is-invalid @enderror" 
                                id="parent_id" name="parent_id" disabled>
                            <option value="">Select a service first</option>
                        </select>
                        @error('parent_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>
                
                <div class="mt-4 d-flex justify-content-end">
                    <a href="{{ route('admin.users.index') }}" class="btn btn-secondary me-2">Cancel</a>
                    <button type="submit" class="btn btn-primary">Create User</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('script')
<script>
    $(document).ready(function() {
        // When region changes, load services
        $('#region_id').change(function() {
            var regionId = $(this).val();
            var userType = $('#type').val();

            $('#service_id').empty().prop('disabled', true);
            $('#parent_id').empty().prop('disabled', true);
            
            if (regionId) {
                if(userType === 'CDC TT' || userType === 'DR') {
                    getUserDrByRegion(regionId);
                } else {
                    getServiceByRegion(regionId);
                }
            }
        });
    
        // When service changes, load users (CDV/CSC)
        $('#service_id').change(function() {
            var serviceId = $(this).val();
            var userType = $('#type').val();
            
            $('#parent_id').empty().prop('disabled', true);
            
            if (serviceId) {
                if(userType === 'CDC TT') {
                    getUserDrByService(serviceId);
                } else {
                    getUserByService(serviceId);
                }
            }
        });
    });

    function getServiceByRegion(regionId) {
        $.ajax({
            url: '{{ route("admin.services.by.region") }}',
            type: 'GET',
            data: { region_id: regionId },
            success: function(data) {
                $('#service_id').empty().append('<option value="">Select Service</option>');
                $.each(data, function(key, service) {
                    $('#service_id').append(
                        '<option value="' + service.id + '">' + service.sce_ccial + '</option>'
                    );
                });
                $('#service_id').prop('disabled', false);
            }
        });
    }

    function getUserByService(serviceId) {
        $.ajax({
            url: '{{ route("admin.users.by.service") }}',
            type: 'GET',
            data: { service_id: serviceId },
            success: function(data) {
                $('#parent_id').empty().append('<option value="">Select Manager</option>');
                $.each(data, function(key, user) {
                    $('#parent_id').append(
                        '<option value="' + user.matricule + '">' + 
                        user.name + ' ' + user.surname + ' (' + user.type + ')' +
                        '</option>'
                    );
                });
                $('#parent_id').prop('disabled', false);
            }
        });
    }

    function getUserDrByRegion(regionId) {
        $.ajax({
            url: '{{ route("admin.users.dr.by.region") }}',
            type: 'GET',
            data: { region_id: regionId },
            success: function(data) {
                $('#parent_id').empty().append('<option value="">Select Manager</option>');
                $.each(data, function(key, user) {
                    $('#parent_id').append(
                        '<option value="' + user.matricule + '">' + 
                        user.name + ' ' + user.surname + ' (' + user.type + ')' +
                        '</option>'
                    );
                });
                $('#parent_id').prop('disabled', false);
            }
        });
    }
</script>
@endsection