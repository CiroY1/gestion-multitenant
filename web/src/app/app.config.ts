import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core'
import {
  provideRouter,
  withInMemoryScrolling,
  type InMemoryScrollingFeature,
  type InMemoryScrollingOptions,
} from '@angular/router'

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http'
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor'
import { provideStore } from '@ngrx/store'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { routes } from './app.routes'
import { rootReducer } from './store'
import { localStorageSyncReducer } from './store/layout/layout-reducers'
import { DecimalPipe } from '@angular/common'
import { provideEffects } from '@ngrx/effects'
import { CalendarEffects } from './store/calendar/calendar.effects'
import { AuthenticationEffects } from './store/authentication/authentication.effects'
import { provideToastr } from 'ngx-toastr'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BrowserModule } from '@angular/platform-browser'

// scroll
const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
}

const inMemoryScrollingFeatures: InMemoryScrollingFeature =
  withInMemoryScrolling(scrollConfig)

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, inMemoryScrollingFeatures),
    DecimalPipe,
    provideStore(rootReducer, { metaReducers: [localStorageSyncReducer] }),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideEffects(AuthenticationEffects, CalendarEffects),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([authTokenInterceptor])
    ),
    importProvidersFrom(BrowserAnimationsModule, BrowserModule),
    provideToastr({}),
  ],
}
