import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface MapLocation {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="map-container">
      <div id="map" class="map"></div>
      <div class="center-marker" *ngIf="!readOnly">
        <div class="pin"></div>
        <div class="pulse"></div>
      </div>
      <div class="map-controls" *ngIf="!readOnly">
        <div class="coordinates" *ngIf="currentLocation">
          <span>Lat: {{currentLocation.latitude | number:'1.6-6'}}</span>
          <span>Lng: {{currentLocation.longitude | number:'1.6-6'}}</span>
        </div>
        <div class="button-group">
          <button mat-raised-button color="accent" (click)="getUserLocation()" title="Use my current location">
            <mat-icon>my_location</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="confirmLocation()">
            <mat-icon>check</mat-icon> Confirm Location
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      height: 300px;
      width: 100%;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .map {
      height: 100%;
      width: 100%;
    }
    .map-controls {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    .coordinates {
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
    }
    .button-group {
      display: flex;
      gap: 8px;
    }
    .center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 999;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .pin {
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      background: #c30b82;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -15px 0 0 -10px;
      animation-name: bounce;
      animation-duration: 1s;
      animation-fill-mode: both;
    }
    .pin:after {
      content: '';
      width: 10px;
      height: 10px;
      margin: 5px 0 0 5px;
      background: #ffffff;
      position: absolute;
      border-radius: 50%;
    }
    .pulse {
      background: rgba(195, 11, 130, 0.2);
      border-radius: 50%;
      height: 40px;
      width: 40px;
      position: absolute;
      left: 50%;
      top: 50%;
      margin: -25px 0 0 -20px;
      transform: rotateX(55deg);
      z-index: -1;
    }
    .pulse:after {
      content: "";
      border-radius: 50%;
      height: 50px;
      width: 50px;
      position: absolute;
      margin: -5px 0 0 -5px;
      animation: pulsate 1s ease-out;
      animation-iteration-count: infinite;
      opacity: 0;
      box-shadow: 0 0 1px 2px #c30b82;
      animation-delay: 1s;
    }
    @keyframes pulsate {
      0% {
        transform: scale(0.1, 0.1);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: scale(1.2, 1.2);
        opacity: 0;
      }
    }
    @keyframes bounce {
      0% {
        opacity: 0;
        transform: translateY(-2000px) rotate(-45deg);
      }
      60% {
        opacity: 1;
        transform: translateY(30px) rotate(-45deg);
      }
      80% {
        transform: translateY(-10px) rotate(-45deg);
      }
      100% {
        transform: translateY(0) rotate(-45deg);
      }
    }
  `]
})
export class MapPickerComponent implements OnInit, AfterViewInit {
  @Input() initialLocation?: MapLocation;
  @Input() readOnly = false;
  @Output() locationSelected = new EventEmitter<MapLocation>();
  
  private map!: L.Map;
  private marker!: L.Marker;
  currentLocation?: MapLocation;
  private mapInitialized = false;
  private mapElement: string = 'map';
  private userLocationMarker?: L.Marker;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Generate a unique ID for the map element to avoid conflicts when multiple maps are on the page
    this.mapElement = 'map-' + Math.random().toString(36).substring(2, 15);
    
    // If not in read-only mode, ask for user's location permission when component initializes
    if (!this.readOnly && !this.initialLocation) {
      this.getUserLocation();
    }
  }

  ngAfterViewInit(): void {
    // Initialize the map after the view is fully initialized
    setTimeout(() => this.initMap(), 100);
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      this.snackBar.open('Requesting your location...', '', { duration: 2000 });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          if (this.map) {
            // Center map on user's location
            this.map.setView([userLat, userLng], 15);
            
            // Update the current location
            this.updateLocation(userLat, userLng);
            
            this.snackBar.open('Map centered on your current location', '', { duration: 3000 });
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          this.snackBar.open(errorMessage, 'Dismiss', { duration: 5000 });
        }
      );
    } else {
      this.snackBar.open('Geolocation is not supported by your browser', 'Dismiss', { duration: 5000 });
    }
  }

  private initMap(): void {
    if (this.mapInitialized) {
      return; // Prevent multiple initializations
    }
    
    // Find the map element by its ID
    const mapDiv = document.getElementById('map');
    if (!mapDiv) {
      console.error('Map element not found');
      return;
    }
    
    // Create map instance
    this.map = L.map(mapDiv, {
      center: this.initialLocation 
        ? [this.initialLocation.latitude, this.initialLocation.longitude] as L.LatLngTuple
        : [51.505, -0.09] as L.LatLngTuple, // Default to London if no initial location
      zoom: 13,
      dragging: !this.readOnly,
      touchZoom: !this.readOnly,
      doubleClickZoom: !this.readOnly,
      scrollWheelZoom: !this.readOnly,
      boxZoom: !this.readOnly,
      keyboard: !this.readOnly,
      zoomControl: !this.readOnly
    });
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (this.readOnly) {
      // In read-only mode, just add a marker at the initial position
      const initialPosition = this.initialLocation 
        ? new L.LatLng(this.initialLocation.latitude, this.initialLocation.longitude)
        : this.map.getCenter();
      
      this.marker = L.marker(initialPosition, { 
        draggable: false
      }).addTo(this.map);
      
      this.updateLocation(initialPosition.lat, initialPosition.lng);
    } else {
      // In interactive mode, update location when map moves
      this.map.on('moveend', this.onMapMoveEnd.bind(this));
      
      // Set initial location
      const center = this.map.getCenter();
      this.updateLocation(center.lat, center.lng);
    }
    
    // Force a resize to ensure the map renders correctly
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
    
    this.mapInitialized = true;
  }

  private onMapMoveEnd(event: L.LeafletEvent): void {
    const center = this.map.getCenter();
    this.updateLocation(center.lat, center.lng);
  }

  private updateLocation(latitude: number, longitude: number): void {
    this.currentLocation = { latitude, longitude };
  }

  confirmLocation(): void {
    if (this.currentLocation) {
      this.locationSelected.emit(this.currentLocation);
      this.snackBar.open('Location confirmed', '', { duration: 2000 });
    }
  }
} 