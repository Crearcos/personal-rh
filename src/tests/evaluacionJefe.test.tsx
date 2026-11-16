import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EvaluacionJefe } from '../components/EvaluacionJefe';
import type { CriterioEvaluacion, Departamento, Empleado } from '../types/models';

const criteriosMock = [
  { id: 'c1', nombre: 'Trabajo en equipo', peso: 0.3 },
  { id: 'c2', nombre: 'Cumplimiento', peso: 0.7 },
] as CriterioEvaluacion[];

describe('EvaluacionJefe', () => {
  it('explica el peso, muestra la puntuación y permite ajustar el criterio', () => {
    const onScoreChange = vi.fn();
    const { container } = render(<EvaluacionJefe criterios={criteriosMock} empleados={[]} selectedEmpleadoId="" periodo="2026-Q1"
      scores={{ c1: 85, c2: 90 }} comentarios={{}} resultado={{ puntajeTotal: 88.5, desempenoNivel: 'Bueno' }}
      isSubmitting={false} onEmpleadoChange={vi.fn()} onPeriodoChange={vi.fn()} onScoreChange={onScoreChange}
      onComentarioChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Trabajo en equipo')).toBeInTheDocument();
    expect(screen.getByText('30% del resultado')).toBeInTheDocument();
    expect(screen.getByText('88.5')).toBeInTheDocument();
    const selector = screen.getByRole('button', { name: 'Seleccionar colaborador del equipo' });
    expect(selector.closest('.overflow-hidden')).toBeNull();
    expect(container.querySelectorAll('.blur-2xl, .blur-3xl').length).toBeGreaterThanOrEqual(4);
    fireEvent.change(screen.getByLabelText('Calificación de Trabajo en equipo'), { target: { value: '75' } });
    expect(onScoreChange).toHaveBeenCalledWith('c1', 75);
    expect(screen.getByLabelText('Observaciones sobre Trabajo en equipo')).toBeInTheDocument();
  });

  it('cambia los halos y colores de categoría de Bajo a Regular, Bueno y Excelente según el puntaje asignado', () => {
    const baseProps = {
      criterios: [criteriosMock[0]],
      empleados: [] as Empleado[],
      selectedEmpleadoId: '',
      periodo: '2026-Q1',
      comentarios: {},
      isSubmitting: false,
      onEmpleadoChange: vi.fn(),
      onPeriodoChange: vi.fn(),
      onScoreChange: vi.fn(),
      onComentarioChange: vi.fn(),
      onSubmit: vi.fn(),
    };
    const casos = [
      { score: 60, nivel: 'Bajo' as const, haloClass: 'bg-rose-300/45', borderClass: 'border-rose-200/90' },
      { score: 74, nivel: 'Regular' as const, haloClass: 'bg-amber-200/55', borderClass: 'border-amber-200/90' },
      { score: 85, nivel: 'Bueno' as const, haloClass: 'bg-sky-200/55', borderClass: 'border-sky-200/90' },
      { score: 95, nivel: 'Excelente' as const, haloClass: 'bg-[#a8ffa1]/50', borderClass: 'border-[#86e27f]/80' },
    ];

    const { container, rerender } = render(
      <EvaluacionJefe {...baseProps} scores={{ c1: 60 }} resultado={{ puntajeTotal: 60, desempenoNivel: 'Bajo' }} />
    );

    for (const caso of casos) {
      rerender(
        <EvaluacionJefe
          {...baseProps}
          scores={{ c1: caso.score }}
          resultado={{ puntajeTotal: caso.score, desempenoNivel: caso.nivel }}
        />
      );
      expect(screen.getAllByText(caso.nivel)).toHaveLength(2);
      const halosConColor = Array.from(container.querySelectorAll('[aria-hidden="true"]')).filter((el) =>
        el.classList.contains(caso.haloClass) && el.classList.contains('pointer-events-none')
      );
      expect(halosConColor.length).toBeGreaterThanOrEqual(2);
      const cardsConBorde = Array.from(container.querySelectorAll('div, section')).filter((el) =>
        el.classList.contains(caso.borderClass)
      );
      expect(cardsConBorde.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('muestra todos los colaboradores y permite buscar manualmente (sin distinguir tildes) y filtrar por departamento', () => {
    const departamentos: Departamento[] = [
      { id: 'd1', empresa_id: 'emp', nombre: 'Ventas y Comercial', jefe_id: null, created_at: '' },
      { id: 'd2', empresa_id: 'emp', nombre: 'Operaciones y Logística', jefe_id: null, created_at: '' },
    ];
    const empleados = Array.from({ length: 50 }, (_, index) => ({
      id: `e${index + 1}`,
      empresa_id: 'emp',
      usuario_id: `u${index + 1}`,
      nombre: index === 0 ? 'Alejandro Cárdenas' : index === 1 ? 'Lucía Paredes' : `Colaborador ${index + 1}`,
      cargo: index === 0 ? 'Analista QA' : 'Asesor Comercial',
      departamento_id: index % 2 === 0 ? 'd2' : 'd1',
      jefe_id: null,
      fecha_ingreso: '2025-01-01',
      tipo_contrato: 'Indefinido',
      activo: true,
      created_at: '',
    })) as Empleado[];

    render(<EvaluacionJefe criterios={criteriosMock} empleados={empleados} departamentos={departamentos}
      selectedEmpleadoId="e1" periodo="2026-Q1" scores={{ c1: 85, c2: 90 }} comentarios={{}}
      resultado={{ puntajeTotal: 88.5, desempenoNivel: 'Bueno' }} isSubmitting={false}
      onEmpleadoChange={vi.fn()} onPeriodoChange={vi.fn()} onScoreChange={vi.fn()}
      onComentarioChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('50 disponibles')).toBeInTheDocument();

    const deptoSelect = screen.getByRole('button', { name: 'Filtrar colaboradores por departamento' });
    expect(deptoSelect.closest('.overflow-hidden')).toBeNull();
    fireEvent.click(deptoSelect);
    fireEvent.click(screen.getByRole('button', { name: /ventas y comercial/i }));
    expect(screen.getByText('25 disponibles')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar colaboradores por departamento' }));
    fireEvent.click(screen.getByRole('button', { name: /todos los departamentos/i }));
    expect(screen.getByText('50 disponibles')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Buscar colaborador');
    fireEvent.change(searchInput, { target: { value: 'cardenas' } });
    expect(screen.getByText('1 disponible')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getByText('50 disponibles')).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'cardenas' } });

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar colaborador del equipo' }));
    expect(screen.getByText('Analista QA · Operaciones y Logística')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /lucía paredes/i })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Inexistente XYZ' } });
    expect(screen.getByText('0 disponibles')).toBeInTheDocument();
    expect(screen.getByText('No hay colaboradores que coincidan con los filtros.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer filtros' }));
    expect(screen.getByText('50 disponibles')).toBeInTheDocument();
  });

  it('explica si aún no hay criterios para evaluar', () => {
    render(<EvaluacionJefe criterios={[]} empleados={[] as Empleado[]} selectedEmpleadoId="" periodo="2026-Q1"
      scores={{}} comentarios={{}} resultado={{ puntajeTotal: 0, desempenoNivel: 'Bajo' }}
      isSubmitting={false} onEmpleadoChange={vi.fn()} onPeriodoChange={vi.fn()} onScoreChange={vi.fn()}
      onComentarioChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('No hay criterios de evaluación disponibles')).toBeInTheDocument();
  });
});
