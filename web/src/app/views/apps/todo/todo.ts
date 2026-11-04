import { PageTitle } from '@/app/components/page-title'
import { Component, inject } from '@angular/core'
import { TodoData, type TodoType } from './data'
import { CommonModule } from '@angular/common'
import type { Observable } from 'rxjs'
import { TableService } from '@/app/core/services/table.service'
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [PageTitle, CommonModule, NgbPaginationModule, FormsModule],
  templateUrl: './todo.html',
  styles: ``,
})
export class Todo {
  todo$: Observable<TodoType[]>
  total$: Observable<number>

  public tableService = inject(TableService<TodoType>)

  constructor() {
    this.todo$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(TodoData, 10)
  }
}
