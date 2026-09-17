import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ProjectsSection } from '../home/sections/projects.section';

@Component({
  selector: 'app-portfolio-page',
  imports: [PageHeaderComponent, ProjectsSection],
  templateUrl: './portfolio.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPage {}
