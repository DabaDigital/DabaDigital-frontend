import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ServicesSection } from '../home/sections/services.section';

@Component({
  selector: 'app-services-page',
  imports: [PageHeaderComponent, ServicesSection],
  templateUrl: './services.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesPage {}
