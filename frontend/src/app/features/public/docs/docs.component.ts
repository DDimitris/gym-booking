import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {
  enHtml = '';
  elHtml = '';

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    // Load both English and Greek translations for the docs content so we can show both simultaneously
    this.translate.getTranslation('en').subscribe(t => {
      const tt: any = t as any;
      this.enHtml = (tt && tt['docs'] && tt['docs']['agreement'] && tt['docs']['agreement']['contentHtml']) || '';
    });
    this.translate.getTranslation('el').subscribe(t => {
      const tt: any = t as any;
      this.elHtml = (tt && tt['docs'] && tt['docs']['agreement'] && tt['docs']['agreement']['contentHtml']) || '';
    });
  }
}
